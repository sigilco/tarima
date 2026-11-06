import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-wire-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.GEOAPIFY_API_KEY = "test-fixture-key";

const { db } = await import("../db");
const { venueCatalog, providerLedger } = await import("../db/schema");
const { eq } = await import("drizzle-orm");
const { fixtureFetch } = await import("./place-fixtures");
const { searchVenues, setVenueSearchDeps } = await import("./venue-search");
const { ledgerGet } = await import("./providers/ledger");
const { resetGooglePlacesBreakers, resetGooglePlacesSession } =
  await import("./providers/googleplaces");
const { resetCrawlCaches } = await import("./enrich");

const noSleep = () => Promise.resolve();
const PAID = ["places.googleapis.com", "places-api.foursquare.com"];
const paidCalls = (calls: string[]) => calls.filter((c) => PAID.some((h) => c.includes(h)));

const GOOGLE_ENV = {
  GOOGLE_PLACES_ENABLED: "1",
  GOOGLE_MAPS_API_KEY: "test-key-not-real",
  GOOGLE_PLACES_FIELD_TIER: "pro",
  GOOGLE_PLACES_DAILY_BUDGET: "10",
  GOOGLE_PLACES_ENTERPRISE_DAILY: "10",
  FSQ_API_KEY: "test-fsq-key",
} satisfies NodeJS.ProcessEnv;

function depsFor(fetch: typeof globalThis.fetch, env: NodeJS.ProcessEnv = {}, enrichTopK?: number) {
  setVenueSearchDeps({ fetch, geoapifyKey: "test-fixture-key", env, sleep: noSleep, enrichTopK });
}

beforeEach(() => {
  db.delete(venueCatalog).run();
  db.delete(providerLedger).run();
  resetGooglePlacesBreakers();
  resetGooglePlacesSession();
  resetCrawlCaches();
});

describe("searchVenues wired pipeline", () => {
  it("cold run misses, warm run hits with zero provider calls, Google tier off = zero paid calls", async () => {
    const cold = fixtureFetch();
    depsFor(cold.fetch);
    const miss = await searchVenues({
      city: "Berkeley",
      query: "look for venues near UC Berkeley",
      category: "food",
      radiusM: 1500,
    });
    expect(miss.cache).toBe("miss");
    expect(miss.venues.length).toBeGreaterThan(0);
    expect(miss.escalation).toContain("sufficient");
    expect(cold.calls.length).toBeGreaterThan(0);
    expect(paidCalls(cold.calls)).toHaveLength(0);

    const warm = fixtureFetch();
    depsFor(warm.fetch);
    const hit = await searchVenues({
      city: "Berkeley",
      query: "look for venues near UC Berkeley",
      category: "food",
      radiusM: 1500,
    });
    expect(hit.cache).toBe("hit");
    expect(hit.escalation).toBe("cache_hit");
    expect(warm.calls).toHaveLength(0);
    expect(paidCalls(warm.calls)).toHaveLength(0);
  });

  it("enriches shortlisted venues via the cauce crawl and writes contact_source", async () => {
    const { fetch, calls } = fixtureFetch();
    depsFor(fetch, {}, 25);
    const out = await searchVenues({
      city: "Berkeley",
      query: "venues near UC Berkeley",
      category: "food",
      radiusM: 1500,
    });
    expect(out.enriched).toBeGreaterThan(0);
    expect(calls.some((c) => c.includes("/api/pages"))).toBe(true);
    const enriched = out.venues.find((v) => v.contactEmail === "bookings@studiokilo.example");
    expect(enriched?.contactSource).toBe("page_text");
    // Provenance is also on the catalog row.
    const row = db.select().from(venueCatalog).where(eq(venueCatalog.id, enriched!.id)).get()!;
    expect(row.contactSource).toBe("page_text");
    expect(row.enrichedAt).not.toBeNull();
  });

  it("keeps the LLM fallback off by default (no llm-extract ledger spend)", async () => {
    const { fetch } = fixtureFetch({ cauceMarkdown: "# Bare page\n\nNothing here.\n" });
    depsFor(fetch); // env {} -> TARIMA_LLM_EXTRACT_ENABLED unset
    const out = await searchVenues({
      city: "Berkeley",
      query: "venues near UC Berkeley quiet",
      category: "food",
      radiusM: 1500,
    });
    expect(out.enriched ?? 0).toBe(0);
    const llmRows = db
      .select()
      .from(providerLedger)
      .where(eq(providerLedger.provider, "llm-extract"))
      .all();
    expect(llmRows).toHaveLength(0);
  });

  it("escalates to Google + Foursquare only when tier-1 results are thin", async () => {
    const thin = {
      geoapifyPlacesBody: { features: [] },
      overpassBody: { elements: [] },
    };
    const { fetch, calls } = fixtureFetch(thin);
    depsFor(fetch, GOOGLE_ENV);
    const out = await searchVenues({
      city: "Berkeley",
      query: "thin catalog probe near UC Berkeley",
      category: "food",
      radiusM: 1500,
    });
    expect(out.cache).toBe("miss");
    expect(out.escalation).toContain("thin_results");
    expect(out.escalation).toContain("google_text=ok:1");
    expect(out.escalation).toContain("fsq_search=ok:1");
    // Google display fields are session-only.
    expect(out.googlePlaces?.[0]?.placeId).toBe("ChIJberkeleytest");
    expect(
      db.select().from(venueCatalog).where(eq(venueCatalog.name, "Fixture Google Venue")).all(),
    ).toHaveLength(0);
    // FSQ results persist as ordinary catalog rows.
    const fsqRow = db
      .select()
      .from(venueCatalog)
      .where(eq(venueCatalog.provider, "foursquare"))
      .get();
    expect(fsqRow?.externalId).toBe("fsq:fsqfixture001");
    expect(fsqRow?.contactPhone).toBe("+15105550199");
    // contact_source is single-valued: the crawl-written email is
    // page_text, which is the primary (email) contact's provenance.
    expect(["fsq", "page_text"]).toContain(fsqRow?.contactSource);
    // Ledger counted the paid calls: 1 google text + 1 fsq search +
    // 1 fsq details (shortlist pass on the fsq:-keyed row).
    expect(ledgerGet(db, "google-places", "live")).toBe(1);
    expect(ledgerGet(db, "foursquare", "search")).toBe(1);
    expect(ledgerGet(db, "foursquare", "details")).toBe(1);
    expect(paidCalls(calls)).toHaveLength(3);
  });

  it("does not escalate when tier-1 results are sufficient even with keys set", async () => {
    const { fetch, calls } = fixtureFetch();
    depsFor(fetch, GOOGLE_ENV);
    const out = await searchVenues({
      city: "Berkeley",
      query: "venues near UC Berkeley plenty",
      category: "food",
      radiusM: 1500,
    });
    expect(out.escalation).toContain("sufficient");
    expect(out.googlePlaces).toBeUndefined();
    expect(paidCalls(calls)).toHaveLength(0);
  });
});
