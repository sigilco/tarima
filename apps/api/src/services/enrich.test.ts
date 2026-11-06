import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// The database url must be set BEFORE the db module is imported.
const dir = mkdtempSync(join(tmpdir(), "tarima-enrich-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { venueCatalog, providerLedger } = await import("../db/schema");
const { eq } = await import("drizzle-orm");
const {
  enrichVenueContact,
  enrichVenueContacts,
  parseRobots,
  resetCrawlCaches,
  verifyLlmProposal,
} = await import("./enrich");
const { extractPageContact } = await import("./extract");

const FIX = join(import.meta.dirname, "fixtures", "enrich");
const fixture = (name: string) => readFileSync(join(FIX, name), "utf8");

const CAUCE = "http://cauce.test";
const SITE = "https://venue.test";

let seq = 0;
function venue(over: Partial<Parameters<typeof enrichVenueContact>[1]> = {}) {
  seq += 1;
  return {
    id: `v-${seq}`,
    name: `Test Venue ${seq}`,
    website: `${SITE}/`,
    contactEmail: null,
    contactPhone: null,
    ...over,
  };
}

async function seedVenue(v: ReturnType<typeof venue>) {
  db.insert(venueCatalog)
    .values({
      id: v.id,
      city: "Berkeley",
      name: v.name,
      source: "test",
      website: v.website,
      contactEmail: v.contactEmail,
      contactPhone: v.contactPhone,
      createdAt: Date.now(),
    })
    .run();
}

/** fetch router: robots.txt + cauce /api/pages, everything else 404. */
function makeFetch(opts: { robots?: string | null; markdown?: string; pageStatus?: number }): {
  fetch: typeof fetch;
  calls: { url: string; method: string }[];
} {
  const calls: { url: string; method: string }[] = [];
  const impl = (async (url: unknown, init?: RequestInit) => {
    const u = String(url);
    const method = init?.method ?? "GET";
    calls.push({ url: u, method });
    if (u === `${SITE}/robots.txt`) {
      if (opts.robots === null) return new Response("nf", { status: 404 });
      return new Response(opts.robots ?? "User-agent: *\nAllow: /\n", {
        headers: { "Content-Type": "text/plain" },
      });
    }
    if (u === `${CAUCE}/api/pages` && method === "POST") {
      if (opts.pageStatus && opts.pageStatus !== 201) {
        return new Response("err", { status: opts.pageStatus });
      }
      return new Response(
        JSON.stringify({
          url: `${SITE}/`,
          fetched_at: new Date().toISOString(),
          title: "Test Venue",
          markdown: opts.markdown ?? "",
          byte_len: 100,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response("nf", { status: 404 });
  }) as typeof fetch;
  return { fetch: impl, calls };
}

const noSleep = () => Promise.resolve();
const DEPS = { cauceBase: CAUCE, sleep: noSleep, env: {} as NodeJS.ProcessEnv };

beforeAll(() => {
  // tables come from bootstrap DDL
});

beforeEach(() => {
  resetCrawlCaches();
  db.delete(providerLedger).run();
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("parseRobots", () => {
  it("honors the most specific group: tarima-bot beats *", () => {
    const rules = parseRobots(fixture("robots-disallow.txt"));
    // The tarima-bot group wins over `*`: only /private/ is disallowed
    // for us, and its Crawl-delay (2) applies, not the star group's 5.
    expect(rules.disallow).toEqual(["/private/"]);
    expect(rules.crawlDelaySec).toBe(2);
  });
});

describe("extractPageContact on fixtures", () => {
  it("reads JSON-LD from the WordPress fixture", () => {
    const c = extractPageContact(fixture("wp-jsonld.html"));
    expect(c.email?.value).toBe("events@verdetaco.example");
    expect(c.phone?.value).toBe("(510) 555-0142");
  });

  it("reads tel/mailto from the bare-HTML fixture", () => {
    const c = extractPageContact(fixture("bare-tel-mailto.html"));
    expect(c.email?.source).toBe("mailto");
    expect(c.phone?.source).toBe("tel");
  });
});

describe("enrichVenueContact", () => {
  it("skips a venue that already has both contacts", async () => {
    const v = venue({ contactEmail: "a@b.c", contactPhone: "1" });
    const { fetch, calls } = makeFetch({});
    const res = await enrichVenueContact(db, v, { ...DEPS, fetch });
    expect(res).toMatchObject({ enriched: false, reason: "has_contact" });
    expect(calls).toHaveLength(0);
  });

  it("skips a venue without a website", async () => {
    const res = await enrichVenueContact(db, venue({ website: null }), DEPS);
    expect(res).toMatchObject({ enriched: false, reason: "no_website" });
  });

  it("skips when the run crawl budget is exhausted", async () => {
    const v = venue();
    await seedVenue(v);
    const { fetch, calls } = makeFetch({ markdown: fixture("cauce-markdown-contact.md") });
    const res = await enrichVenueContact(db, v, {
      ...DEPS,
      fetch,
      budget: { remaining: 0 },
    });
    expect(res).toMatchObject({ enriched: false, reason: "budget" });
    expect(calls).toHaveLength(0);
  });

  it("honors robots.txt Disallow and never calls cauce", async () => {
    const v = venue({ website: `${SITE}/private/thing` });
    await seedVenue(v);
    const { fetch, calls } = makeFetch({
      robots: fixture("robots-disallow.txt"),
      markdown: fixture("cauce-markdown-contact.md"),
    });
    const res = await enrichVenueContact(db, v, { ...DEPS, fetch });
    expect(res).toMatchObject({ enriched: false, reason: "robots" });
    expect(calls.some((c) => c.url === `${CAUCE}/api/pages`)).toBe(false);
  });

  it("enriches from cauce markdown and writes page_text contacts", async () => {
    const v = venue();
    await seedVenue(v);
    const { fetch } = makeFetch({
      robots: null,
      markdown: fixture("cauce-markdown-contact.md"),
    });
    const res = await enrichVenueContact(db, v, { ...DEPS, fetch });
    expect(res.enriched).toBe(true);
    if (!res.enriched) return;
    expect(res.fields.contactEmail).toBe("bookings@studiokilo.example");
    expect(res.fields.contactPhone).toBe("(510) 555-0164");
    expect(res.sources.email).toBe("page_text");

    const row = db.select().from(venueCatalog).where(eq(venueCatalog.id, v.id)).get()!;
    expect(row.contactEmail).toBe("bookings@studiokilo.example");
    expect(row.contactPhone).toBe("(510) 555-0164");
    expect(row.enrichedAt).not.toBeNull();
  });

  it("does not overwrite an existing contact", async () => {
    const v = venue({ contactEmail: "keep@venue.test" });
    await seedVenue(v);
    const { fetch } = makeFetch({
      robots: null,
      markdown: fixture("cauce-markdown-contact.md"),
    });
    const res = await enrichVenueContact(db, v, { ...DEPS, fetch });
    expect(res.enriched).toBe(true);
    const row = db.select().from(venueCatalog).where(eq(venueCatalog.id, v.id)).get()!;
    expect(row.contactEmail).toBe("keep@venue.test");
    expect(row.contactPhone).toBe("(510) 555-0164");
  });

  it("returns fetch_failed when cauce errors", async () => {
    const v = venue();
    await seedVenue(v);
    const { fetch } = makeFetch({ robots: null, pageStatus: 502 });
    const res = await enrichVenueContact(db, v, { ...DEPS, fetch });
    expect(res).toMatchObject({ enriched: false, reason: "fetch_failed" });
  });
});

describe("LLM fallback (tier 3)", () => {
  it("verifyLlmProposal keeps only verbatim values", () => {
    const page = "Call 5105550164 for the desk.";
    expect(verifyLlmProposal({ phone: "510-555-0164" }, page).phone).toBe("510-555-0164");
    expect(verifyLlmProposal({ email: "desk@northgate.example" }, page).email).toBeUndefined();
    expect(
      verifyLlmProposal({ email: "Desk@Northgate.example" }, "mail Desk@Northgate.example now")
        .email,
    ).toBe("Desk@Northgate.example");
    expect(verifyLlmProposal({ phone: "415-555-9999" }, page).phone).toBeUndefined();
  });

  it("uses the LLM only when extraction found nothing, and only verified values", async () => {
    const v = venue();
    await seedVenue(v);
    const { fetch } = makeFetch({
      robots: null,
      markdown: fixture("cauce-markdown-llm-phone.md"),
    });
    const res = await enrichVenueContact(db, v, {
      ...DEPS,
      fetch,
      llmExtract: async () => ({ phone: "510-555-0164", email: "invented@nope.example" }),
    });
    expect(res.enriched).toBe(true);
    if (!res.enriched) return;
    expect(res.fields.contactPhone).toBe("510-555-0164");
    expect(res.fields.contactEmail).toBeUndefined();
    expect(res.viaLlm).toBe(true);
    expect(res.sources.phone).toBe("llm_verified");
    // cents were booked in the ledger
    const ledger = db.select().from(providerLedger).all();
    expect(ledger.some((r) => r.provider === "llm-extract" && r.bucket === "cents")).toBe(true);
  });

  it("rejects an invented email outright", async () => {
    const v = venue();
    await seedVenue(v);
    const { fetch } = makeFetch({
      robots: null,
      markdown: fixture("cauce-markdown-empty.md"),
    });
    const res = await enrichVenueContact(db, v, {
      ...DEPS,
      fetch,
      llmExtract: async () => ({ email: "info@quietcorner.example" }),
    });
    expect(res).toMatchObject({ enriched: false, reason: "no_contact_found" });
  });

  it("stops at the daily cents cap", async () => {
    const v = venue();
    await seedVenue(v);
    const { fetch } = makeFetch({
      robots: null,
      markdown: fixture("cauce-markdown-empty.md"),
    });
    const res = await enrichVenueContact(db, v, {
      ...DEPS,
      fetch,
      env: { TARIMA_LLM_EXTRACT_DAILY_CENTS: "0" },
      llmExtract: async () => ({ email: "x@y.z" }),
    });
    expect(res).toMatchObject({ enriched: false, reason: "llm_budget" });
  });
});

describe("enrichVenueContacts", () => {
  it("shares one crawl budget across the batch", async () => {
    const vs = [venue(), venue(), venue()];
    for (const v of vs) await seedVenue(v);
    const { fetch, calls } = makeFetch({
      robots: null,
      markdown: fixture("cauce-markdown-contact.md"),
    });
    const results = await enrichVenueContacts(db, vs, {
      ...DEPS,
      fetch,
      budget: { remaining: 2 },
    });
    expect(results.map((r) => r.enriched)).toEqual([true, true, false]);
    expect(results[2]).toMatchObject({ reason: "budget" });
    expect(calls.filter((c) => c.url === `${CAUCE}/api/pages`)).toHaveLength(2);
  });
});
