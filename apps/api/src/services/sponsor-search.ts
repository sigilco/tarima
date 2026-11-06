/**
 * Sponsor discovery via the local cauce metasearch instance
 * (tarima-search-plan Phase 4). One `GET /api/search` call returns the
 * RRF-fused SERP; this module ranks it, dedupes by domain, and returns
 * company candidates.
 *
 * Honest-contact rule applies downstream: a SERP result is a POINTER
 * to the official site, never a contact fact. `search_sponsors` results
 * carry title/url/snippet only — contacts come from the venue-site
 * enrichment ladder or the user.
 */
import type { InjectedFetch } from "./providers/foursquare";

export interface SponsorCandidate {
  title: string;
  url: string;
  /** Registrable-ish domain (www stripped, last two labels). */
  domain: string;
  snippet: string;
  score: number;
  engine: string;
}

export type SponsorSearchResult =
  | { ok: true; query: string; sponsors: SponsorCandidate[] }
  | { ok: false; reason: "no_cauce" | "http_error" | "bad_response"; status?: number };

interface CauceResult {
  url?: unknown;
  title?: unknown;
  snippet?: unknown;
  engine?: unknown;
  score?: unknown;
}

interface CauceResponse {
  query?: unknown;
  results?: unknown;
}

/** Last-two-labels domain key; good enough for dedup, not a PSL. */
export function domainOf(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    const parts = host.split(".").filter(Boolean);
    if (parts.length < 2) return null;
    // Keep three labels for common second-level ccTLDs (co.uk etc.).
    const sld = ["co", "com", "org", "net", "ac", "gov"];
    if (parts.length >= 3 && sld.includes(parts[parts.length - 2]!)) {
      return parts.slice(-3).join(".");
    }
    return parts.slice(-2).join(".");
  } catch {
    return null;
  }
}

/**
 * Rank and domain-dedupe raw cauce results. Pure — exported for tests.
 * Sort: RRF score desc; dedupe keeps the best-scoring row per domain.
 */
export function rankSponsors(results: CauceResult[], limit = 10): SponsorCandidate[] {
  const scored: SponsorCandidate[] = [];
  for (const r of results) {
    if (typeof r.url !== "string" || typeof r.title !== "string") continue;
    const domain = domainOf(r.url);
    if (!domain) continue;
    scored.push({
      title: r.title,
      url: r.url,
      domain,
      snippet: typeof r.snippet === "string" ? r.snippet : "",
      score: typeof r.score === "number" ? r.score : 0,
      engine: typeof r.engine === "string" ? r.engine : "unknown",
    });
  }
  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: SponsorCandidate[] = [];
  for (const s of scored) {
    if (seen.has(s.domain)) continue;
    seen.add(s.domain);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

export interface SponsorSearchDeps {
  fetch?: InjectedFetch;
  /** cauce base URL; default env CAUCE_BASE_URL or the dev instance. */
  cauceBase?: string;
  env?: NodeJS.ProcessEnv;
  limit?: number;
}

export async function searchSponsors(
  query: string,
  deps: SponsorSearchDeps = {},
): Promise<SponsorSearchResult> {
  const env = deps.env ?? process.env;
  const cauceBase = (deps.cauceBase ?? env.CAUCE_BASE_URL ?? "http://127.0.0.1:4479").replace(
    /\/$/,
    "",
  );
  const url = `${cauceBase}/api/search?q=${encodeURIComponent(query)}`;

  let res: Response;
  try {
    res = await (deps.fetch ?? fetch)(url, {
      headers: { Accept: "application/json" },
    });
  } catch {
    return { ok: false, reason: "http_error" };
  }
  if (!res.ok) return { ok: false, reason: "http_error", status: res.status };

  let body: CauceResponse;
  try {
    body = (await res.json()) as CauceResponse;
  } catch {
    return { ok: false, reason: "bad_response" };
  }
  const results = Array.isArray(body.results) ? (body.results as CauceResult[]) : [];
  return {
    ok: true,
    query,
    sponsors: rankSponsors(results, deps.limit ?? 10),
  };
}
