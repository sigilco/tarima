/**
 * Tier-2 enrichment ladder (tarima-search-plan §1.3/Phase 3): for
 * shortlisted venues that lack contact fields, crawl the venue's own
 * website through the cauce fetch-and-index pipeline and extract
 * JSON-LD + NAP contact data.
 *
 * Constitution (plan §1.3 "tier-2 constitution"):
 * - Venue/company OWN sites only, via cauce `fetch_and_index`
 *   (POST {CAUCE_BASE_URL}/api/pages — the same Archiver pipeline the
 *   MCP tool wraps; chosen over raw MCP JSON-RPC because it is the
 *   identical fetch path with a plain HTTP contract).
 * - robots.txt checked first per host (24 h in-memory cache);
 *   Disallow honored, Crawl-delay honored (floor 1 s, cap 10 s).
 * - Budgets: TARIMA_CRAWL_BUDGET_PER_RUN page fetches per run
 *   (default 30), TARIMA_LLM_EXTRACT_DAILY_CENTS for the LLM fallback
 *   (default 100 = $1/day, tracked in provider_ledger bucket
 *   `llm_extract_cents`).
 * - Honest-contact rule: a contact is written ONLY when the value was
 *   found verbatim on the page (JSON-LD, mailto:/tel: link, or page
 *   text). The LLM fallback may propose fields but each value must
 *   literally appear in the fetched page text or it is discarded —
 *   the LLM can point, never invent.
 * - Never Google, never SERP snippets as contact facts.
 */
import { eq } from "drizzle-orm";
import { venueCatalog } from "../db/schema";
import type { ApiDb } from "./projects";
import { extractPageContact, type ContactSource } from "./extract";
import { ledgerAdd, ledgerGet } from "./providers/ledger";
import type { InjectedFetch } from "./providers/foursquare";

const UA = "tarima-bot/0.1 (+https://tarima.local)";
const LLM_PROVIDER = "llm-extract";
const LLM_BUCKET = "cents";
/** Estimated cost booked per LLM extraction call (cents). */
export const LLM_EXTRACT_ESTIMATED_CENTS = 5;
const ROBOTS_TTL_MS = 24 * 60 * 60_000;

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------

interface RobotsRules {
  disallow: string[];
  crawlDelaySec?: number;
}

const ROBOTS_CACHE = new Map<string, { at: number; rules: RobotsRules }>();

/** Test hook. */
export function resetCrawlCaches(): void {
  ROBOTS_CACHE.clear();
}

interface RobotsGroup {
  agents: string[];
  disallow: string[];
  crawlDelaySec?: number;
}

/**
 * Parse robots.txt into UA groups, then pick the winner the way
 * crawlers do: the group naming our UA token beats the `*` group;
 * groups never merge.
 */
export function parseRobots(txt: string, uaToken = "tarima-bot"): RobotsRules {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = /^(user-agent|disallow|allow|crawl-delay)\s*:\s*(.*)$/i.exec(line);
    if (!m) continue;
    const field = m[1]!.toLowerCase();
    const value = m[2]!.trim();
    if (field === "user-agent") {
      if (!current || current.disallow.length > 0 || current.crawlDelaySec !== undefined) {
        current = { agents: [], disallow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      continue;
    }
    if (!current) continue;
    if (field === "disallow" && value) current.disallow.push(value);
    if (field === "crawl-delay") {
      const s = Number.parseFloat(value);
      if (Number.isFinite(s) && s > 0) current.crawlDelaySec = s;
    }
  }
  const specific = groups.find((g) => g.agents.some((a) => a !== "*" && a.includes(uaToken)));
  const star = groups.find((g) => g.agents.includes("*"));
  const winner = specific ?? star;
  if (!winner) return { disallow: [] };
  return { disallow: winner.disallow, crawlDelaySec: winner.crawlDelaySec };
}

function pathAllowed(rules: RobotsRules, path: string): boolean {
  for (const d of rules.disallow) {
    if (d === "/") return false;
    if (path.startsWith(d)) return false;
  }
  return true;
}

async function robotsRulesFor(origin: string, fetchImpl: InjectedFetch): Promise<RobotsRules> {
  const hit = ROBOTS_CACHE.get(origin);
  if (hit && Date.now() - hit.at < ROBOTS_TTL_MS) return hit.rules;
  let rules: RobotsRules = { disallow: [] };
  try {
    const res = await fetchImpl(`${origin}/robots.txt`, {
      headers: { "User-Agent": UA, Accept: "text/plain" },
    });
    if (res.ok) rules = parseRobots(await res.text());
    // Non-OK (404 etc.) = no robots file = allowed.
  } catch {
    // Unreachable robots.txt: proceed; the page fetch itself will fail
    // closed if the host is truly down.
  }
  ROBOTS_CACHE.set(origin, { at: Date.now(), rules });
  return rules;
}

// ---------------------------------------------------------------------------
// cauce fetch-and-index (POST /api/pages — the fetch_and_index pipeline)
// ---------------------------------------------------------------------------

interface CaucePageRow {
  url: string;
  fetched_at: string;
  title: string;
  markdown: string;
  byte_len: number;
}

async function cauceFetchPage(
  cauceBase: string,
  url: string,
  fetchImpl: InjectedFetch,
): Promise<CaucePageRow | null> {
  try {
    const res = await fetchImpl(`${cauceBase}/api/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    const row = (await res.json()) as CaucePageRow;
    return typeof row.markdown === "string" ? row : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// LLM fallback (tier 3): propose-only, verified against page text.
// ---------------------------------------------------------------------------

export interface LlmProposal {
  email?: string;
  phone?: string;
}

export type LlmExtractor = (input: {
  venueName: string;
  pageText: string;
}) => Promise<LlmProposal | null>;

/**
 * Default extractor: OpenAI-compatible chat call against the Bifrost
 * gateway (BIFROST_BASE_URL + BIFROST_VK). Returns null when no
 * gateway is configured — the fallback is then simply unavailable.
 */
export function defaultLlmExtractor(env: NodeJS.ProcessEnv = process.env): LlmExtractor | null {
  const base = env.BIFROST_BASE_URL;
  const key = env.BIFROST_VK;
  if (!base || !key) return null;
  const model = env.TARIMA_LLM_EXTRACT_MODEL ?? "zai-coding-plan/glm-5";
  return async ({ venueName, pageText }) => {
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract the venue's public contact email and phone from the page text. " +
              'Reply JSON only: {"email": string|null, "phone": string|null}. ' +
              "Only report values that appear verbatim in the text; never guess.",
          },
          { role: "user", content: `Venue: ${venueName}\n\n${pageText.slice(0, 12_000)}` },
        ],
      }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return null;
    try {
      const parsed = JSON.parse(content) as LlmProposal;
      return {
        ...(typeof parsed.email === "string" ? { email: parsed.email } : {}),
        ...(typeof parsed.phone === "string" ? { phone: parsed.phone } : {}),
      };
    } catch {
      return null;
    }
  };
}

const EMAIL_SHAPE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function digits(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * The LLM may only re-surface text that is actually on the page.
 * Email: exact (case-insensitive) substring of the page. Phone:
 * digit-normalized substring (formatting may differ).
 */
export function verifyLlmProposal(
  proposal: LlmProposal,
  pageText: string,
): { email?: string; phone?: string } {
  const hay = pageText.toLowerCase();
  const out: { email?: string; phone?: string } = {};
  if (proposal.email && EMAIL_SHAPE.test(proposal.email)) {
    const e = proposal.email.toLowerCase();
    if (hay.includes(e)) out.email = proposal.email;
  }
  if (proposal.phone) {
    const want = digits(proposal.phone);
    if (want.length >= 7 && digits(pageText).includes(want)) out.phone = proposal.phone;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export interface EnrichVenue {
  id: string;
  name: string;
  website?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export interface CrawlBudget {
  remaining: number;
}

export function crawlBudgetFromEnv(env: NodeJS.ProcessEnv = process.env): CrawlBudget {
  const raw = env.TARIMA_CRAWL_BUDGET_PER_RUN;
  const n = raw === undefined || raw === "" ? 30 : Number.parseInt(raw, 10);
  return { remaining: Number.isFinite(n) && n >= 0 ? n : 30 };
}

export function llmDailyCents(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.TARIMA_LLM_EXTRACT_DAILY_CENTS;
  const n = raw === undefined || raw === "" ? 100 : Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 100;
}

export interface EnrichDeps {
  fetch?: InjectedFetch;
  /** cauce base URL; default env CAUCE_BASE_URL or the dev instance. */
  cauceBase?: string;
  env?: NodeJS.ProcessEnv;
  /** Per-run page-fetch budget (shared across a batch call). */
  budget?: CrawlBudget;
  /** LLM fallback; defaults to the Bifrost-backed extractor or null. */
  llmExtract?: LlmExtractor | null;
  /** Injectable sleep for Crawl-delay politeness (tests pass a noop). */
  sleep?: (ms: number) => Promise<void>;
}

export type EnrichSkipReason =
  | "has_contact"
  | "no_website"
  | "budget"
  | "robots"
  | "fetch_failed"
  | "no_contact_found"
  | "llm_budget";

export interface EnrichSources {
  email?: ContactSource | "llm_verified";
  phone?: ContactSource | "llm_verified";
}

export type EnrichResult =
  | {
      enriched: true;
      venueId: string;
      fields: { contactEmail?: string; contactPhone?: string };
      /** Provenance per written field. */
      sources: EnrichSources;
      viaLlm: boolean;
    }
  | { enriched: false; venueId: string; reason: EnrichSkipReason };

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Enrich one venue row. Fills ONLY null contact columns — an existing
 * contact is never overwritten (non-destructive, honest).
 */
export async function enrichVenueContact(
  db: ApiDb,
  venue: EnrichVenue,
  deps: EnrichDeps = {},
): Promise<EnrichResult> {
  const skip = (reason: EnrichSkipReason): EnrichResult => ({
    enriched: false,
    venueId: venue.id,
    reason,
  });

  if (venue.contactEmail && venue.contactPhone) return skip("has_contact");
  const website = venue.website?.trim();
  if (!website) return skip("no_website");

  const env = deps.env ?? process.env;
  const fetchImpl = deps.fetch ?? fetch;
  const budget = deps.budget ?? crawlBudgetFromEnv(env);
  if (budget.remaining <= 0) return skip("budget");

  let origin: string;
  let path: string;
  try {
    const u = new URL(website);
    origin = u.origin;
    path = u.pathname + u.search;
  } catch {
    return skip("no_website");
  }

  // robots.txt first (24 h host cache).
  const rules = await robotsRulesFor(origin, fetchImpl);
  if (!pathAllowed(rules, path)) return skip("robots");
  const delayMs = Math.min(Math.max(rules.crawlDelaySec ?? 1, 1), 10) * 1000;
  await (deps.sleep ?? defaultSleep)(delayMs);

  const cauceBase = (deps.cauceBase ?? env.CAUCE_BASE_URL ?? "http://127.0.0.1:4479").replace(
    /\/$/,
    "",
  );
  budget.remaining -= 1;
  const page = await cauceFetchPage(cauceBase, website, fetchImpl);
  if (!page) return skip("fetch_failed");

  const extracted = extractPageContact(`${page.markdown}\n${page.title}`);
  const fields: { contactEmail?: string; contactPhone?: string } = {};
  const sources: EnrichSources = {};
  let viaLlm = false;

  const wantEmail = !venue.contactEmail && extracted.email;
  const wantPhone = !venue.contactPhone && extracted.phone;
  if (wantEmail) {
    fields.contactEmail = extracted.email!.value;
    sources.email = extracted.email!.source;
  }
  if (wantPhone) {
    fields.contactPhone = extracted.phone!.value;
    sources.phone = extracted.phone!.source;
  }

  if (!fields.contactEmail && !fields.contactPhone) {
    // Tier 3: LLM fallback, propose-only + verbatim verification.
    const spent = ledgerGet(db, LLM_PROVIDER, LLM_BUCKET);
    if (spent >= llmDailyCents(env)) return skip("llm_budget");
    const extractor = deps.llmExtract === undefined ? defaultLlmExtractor(env) : deps.llmExtract;
    if (!extractor) return skip("no_contact_found");
    ledgerAdd(db, LLM_PROVIDER, LLM_BUCKET, LLM_EXTRACT_ESTIMATED_CENTS);
    const proposal = await extractor({ venueName: venue.name, pageText: page.markdown });
    if (proposal) {
      const verified = verifyLlmProposal(proposal, page.markdown);
      if (!venue.contactEmail && verified.email) {
        fields.contactEmail = verified.email;
        sources.email = "llm_verified";
        viaLlm = true;
      }
      if (!venue.contactPhone && verified.phone) {
        fields.contactPhone = verified.phone;
        sources.phone = "llm_verified";
        viaLlm = true;
      }
    }
    if (!fields.contactEmail && !fields.contactPhone) return skip("no_contact_found");
  }

  // Persist: fill only the null columns; stamp enriched_at.
  db.update(venueCatalog)
    .set({
      ...(fields.contactEmail ? { contactEmail: fields.contactEmail } : {}),
      ...(fields.contactPhone ? { contactPhone: fields.contactPhone } : {}),
      enrichedAt: Date.now(),
    })
    .where(eq(venueCatalog.id, venue.id))
    .run();

  return { enriched: true, venueId: venue.id, fields, sources, viaLlm };
}

/**
 * Batch helper: enrich the top-K shortlist lacking contact, sharing
 * one per-run crawl budget. `venues` is expected pre-filtered/sorted
 * by the caller (search_venues integration decides the order).
 */
export async function enrichVenueContacts(
  db: ApiDb,
  venues: EnrichVenue[],
  deps: EnrichDeps = {},
): Promise<EnrichResult[]> {
  const budget = deps.budget ?? crawlBudgetFromEnv(deps.env ?? process.env);
  const results: EnrichResult[] = [];
  for (const venue of venues) {
    results.push(await enrichVenueContact(db, venue, { ...deps, budget }));
  }
  return results;
}
