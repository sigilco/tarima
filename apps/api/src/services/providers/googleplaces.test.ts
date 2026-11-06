import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// The database url must be set BEFORE the db module is imported.
const dir = mkdtempSync(join(tmpdir(), "tarima-gplaces-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../../db");
const { providerLedger } = await import("../../db/schema");
const {
  fieldMaskFor,
  googleCatalogProvenance,
  googlePlacesConfig,
  placeDetails,
  resetGooglePlacesBreakers,
  resetGooglePlacesSession,
  searchNearby,
  searchText,
} = await import("./googleplaces");
const { ledgerGet } = await import("./ledger");

const ENV_ON = {
  GOOGLE_PLACES_ENABLED: "1",
  GOOGLE_MAPS_API_KEY: "test-key-not-real",
  GOOGLE_PLACES_FIELD_TIER: "pro",
  GOOGLE_PLACES_DAILY_BUDGET: "10",
  GOOGLE_PLACES_ENTERPRISE_DAILY: "10",
  GOOGLE_PLACES_WARM_DAILY: "0",
} satisfies NodeJS.ProcessEnv;

const ENV_ENT = { ...ENV_ON, GOOGLE_PLACES_FIELD_TIER: "enterprise" };

type FetchCall = { url: string; init: RequestInit };

function fakeFetch(handler: (call: FetchCall) => Response | Promise<Response>): {
  fetch: typeof fetch;
  calls: FetchCall[];
} {
  const calls: FetchCall[] = [];
  const impl = (async (url: unknown, init?: RequestInit) => {
    const call = { url: String(url), init: init ?? {} };
    calls.push(call);
    return handler(call);
  }) as typeof fetch;
  return { fetch: impl, calls };
}

const jsonRes = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const NEARBY_BODY = {
  places: [
    {
      id: "ChIJtest123",
      displayName: { text: "Triple Rock Brewing" },
      location: { latitude: 37.8734, longitude: -122.2687 },
      formattedAddress: "1920 Shattuck Ave, Berkeley, CA",
      types: ["brewpub", "restaurant"],
      businessStatus: "OPERATIONAL",
      googleMapsUri: "https://maps.google.com/?cid=123",
      timeZone: "America/Los_Angeles",
    },
  ],
};

const DETAILS_BODY = {
  id: "ChIJtest123",
  displayName: { text: "Triple Rock Brewing" },
  nationalPhoneNumber: "(510) 843-2739",
  websiteUri: "https://triplerock.com/",
  regularOpeningHours: { weekdayDescriptions: ["Monday: 4–10 PM"] },
  rating: 4.3,
  userRatingCount: 645,
  priceLevel: "PRICE_LEVEL_INEXPENSIVE",
};

beforeAll(() => {
  // provider_ledger exists via bootstrap DDL; nothing to seed.
});

beforeEach(() => {
  resetGooglePlacesBreakers();
  resetGooglePlacesSession();
  db.delete(providerLedger).run();
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("googlePlacesConfig", () => {
  it("defaults to disabled with pro tier", () => {
    const cfg = googlePlacesConfig({});
    expect(cfg.enabled).toBe(false);
    expect(cfg.fieldTier).toBe("pro");
    expect(cfg.warmDaily).toBe(0);
  });
});

describe("gate: disabled / no key", () => {
  it("returns disabled and never fetches when GOOGLE_PLACES_ENABLED is unset", async () => {
    const { fetch, calls } = fakeFetch(() => jsonRes(NEARBY_BODY));
    const res = await searchNearby(
      db,
      { latitude: 37.87, longitude: -122.25, radiusM: 1500 },
      "pro",
      { fetch, env: {} },
    );
    expect(res).toEqual({ ok: false, reason: "disabled" });
    expect(calls).toHaveLength(0);
  });

  it("returns no_key when enabled without a key", async () => {
    const { fetch, calls } = fakeFetch(() => jsonRes(NEARBY_BODY));
    const res = await searchNearby(
      db,
      { latitude: 37.87, longitude: -122.25, radiusM: 1500 },
      "pro",
      { fetch, env: { ...ENV_ON, GOOGLE_MAPS_API_KEY: "" } },
    );
    expect(res).toEqual({ ok: false, reason: "no_key" });
    expect(calls).toHaveLength(0);
  });
});

describe("field masks", () => {
  it("a pro mask contains no Enterprise field", () => {
    const mask = fieldMaskFor("pro");
    for (const f of [
      "nationalPhoneNumber",
      "websiteUri",
      "regularOpeningHours",
      "rating",
      "userRatingCount",
      "priceLevel",
    ]) {
      expect(mask).not.toContain(f);
    }
  });

  it("enterprise mask adds phone/website/hours/rating/price", () => {
    const mask = fieldMaskFor("enterprise");
    for (const f of [
      "nationalPhoneNumber",
      "websiteUri",
      "regularOpeningHours",
      "rating",
      "userRatingCount",
      "priceLevel",
    ]) {
      expect(mask).toContain(f);
    }
  });
});

describe("searchNearby", () => {
  it("sends the key header-only and the pro mask, parses places", async () => {
    const { fetch, calls } = fakeFetch(() => jsonRes(NEARBY_BODY));
    const res = await searchNearby(
      db,
      { latitude: 37.87, longitude: -122.25, radiusM: 1500, includedTypes: ["brewpub"] },
      "pro",
      { fetch, env: ENV_ON },
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.places[0]?.placeId).toBe("ChIJtest123");
    expect(res.places[0]?.displayName).toBe("Triple Rock Brewing");
    expect(res.cached).toBe(false);

    expect(calls).toHaveLength(1);
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers["X-Goog-Api-Key"]).toBe("test-key-not-real");
    expect(headers["X-Goog-FieldMask"]).toBe(fieldMaskFor("pro"));
    // Header-only key: the key must never appear in the URL.
    expect(calls[0]!.url).not.toContain("test-key-not-real");
    expect(calls[0]!.url).toContain("places:searchNearby");
    const sent = JSON.parse(String(calls[0]!.init.body)) as Record<string, unknown>;
    expect(sent.includedTypes).toEqual(["brewpub"]);
  });

  it("refuses an enterprise mask when FIELD_TIER=pro", async () => {
    const { fetch, calls } = fakeFetch(() => jsonRes(NEARBY_BODY));
    const res = await searchNearby(
      db,
      { latitude: 37.87, longitude: -122.25, radiusM: 1500 },
      "enterprise",
      { fetch, env: ENV_ON },
    );
    expect(res).toEqual({ ok: false, reason: "tier_refused" });
    expect(calls).toHaveLength(0);
  });

  it("refuses enterprise once the enterprise daily bucket is spent", async () => {
    const env = { ...ENV_ENT, GOOGLE_PLACES_ENTERPRISE_DAILY: "1" };
    const { fetch } = fakeFetch(() => jsonRes(DETAILS_BODY, 200));
    const first = await placeDetails(db, "ChIJaaa", "enterprise", { fetch, env });
    expect(first.ok).toBe(true);
    const second = await placeDetails(db, "ChIJbbb", "enterprise", { fetch, env });
    expect(second).toEqual({ ok: false, reason: "tier_refused" });
  });

  it("answers a repeated identical call from the session cache", async () => {
    const { fetch, calls } = fakeFetch(() => jsonRes(NEARBY_BODY));
    const input = { latitude: 37.87, longitude: -122.25, radiusM: 1500 };
    const a = await searchNearby(db, input, "pro", { fetch, env: ENV_ON });
    const b = await searchNearby(db, input, "pro", { fetch, env: ENV_ON });
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(b.cached).toBe(true);
    expect(calls).toHaveLength(1);
  });
});

describe("searchText", () => {
  it("ids tier sends the ids-only mask", async () => {
    const { fetch, calls } = fakeFetch(() =>
      jsonRes({ places: [{ id: "ChIJx", name: "places/ChIJx" }], nextPageToken: "tok" }),
    );
    const res = await searchText(db, { textQuery: "rooftop venue for 40 people Berkeley" }, "ids", {
      fetch,
      env: ENV_ON,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.nextPageToken).toBe("tok");
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers["X-Goog-FieldMask"]).toBe(fieldMaskFor("ids"));
  });
});

describe("placeDetails", () => {
  it("parses the single-place response with enterprise fields", async () => {
    const { fetch, calls } = fakeFetch(() => jsonRes(DETAILS_BODY));
    const res = await placeDetails(db, "ChIJtest123", "enterprise", {
      fetch,
      env: ENV_ENT,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.places).toHaveLength(1);
    expect(res.places[0]?.phone).toBe("(510) 843-2739");
    expect(res.places[0]?.website).toBe("https://triplerock.com/");
    expect(res.places[0]?.rating).toBe(4.3);
    expect(calls[0]!.url).toContain("/v1/places/ChIJtest123");
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers["X-Goog-FieldMask"]).toBe(fieldMaskFor("enterprise"));
  });
});

describe("budgets and breaker", () => {
  it("stops at GOOGLE_PLACES_DAILY_BUDGET live calls", async () => {
    const env = { ...ENV_ON, GOOGLE_PLACES_DAILY_BUDGET: "2" };
    const { fetch, calls } = fakeFetch(() => jsonRes(NEARBY_BODY));
    const input = { latitude: 1, longitude: 1, radiusM: 100 };
    await searchNearby(db, input, "pro", { fetch, env });
    await searchNearby(db, { ...input, latitude: 2 }, "pro", { fetch, env });
    const third = await searchNearby(db, { ...input, latitude: 3 }, "pro", { fetch, env });
    expect(third).toEqual({ ok: false, reason: "over_budget" });
    expect(calls).toHaveLength(2);
    expect(ledgerGet(db, "google-places", "live")).toBe(2);
  });

  it("warming never spends when WARM_DAILY=0", async () => {
    const { fetch, calls } = fakeFetch(() => jsonRes(NEARBY_BODY));
    const res = await searchNearby(db, { latitude: 1, longitude: 1, radiusM: 100 }, "pro", {
      fetch,
      env: ENV_ON,
      purpose: "warm",
    });
    expect(res).toEqual({ ok: false, reason: "over_budget" });
    expect(calls).toHaveLength(0);
  });

  it("a 429 returns rate_limited, opens the breaker and blocks the next call", async () => {
    const { fetch, calls } = fakeFetch(() => jsonRes({ error: "quota" }, 429));
    const input = { latitude: 1, longitude: 1, radiusM: 100 };
    const first = await searchNearby(db, input, "pro", { fetch, env: ENV_ON });
    expect(first).toMatchObject({ ok: false, reason: "rate_limited", status: 429 });
    // Two more 429-weighted events are needed to open; hammer until open.
    let opened = false;
    for (let i = 0; i < 3 && !opened; i++) {
      const r = await searchNearby(db, { ...input, latitude: 10 + i }, "pro", {
        fetch,
        env: ENV_ON,
      });
      opened = !r.ok && r.reason === "breaker_open";
    }
    expect(opened).toBe(true);
    expect(calls.length).toBeLessThanOrEqual(4);
  });
});

describe("no-persist invariant (Places ToS §3.2.3)", () => {
  it("googleCatalogProvenance exposes only place_id + provenance", async () => {
    const { fetch } = fakeFetch(() => jsonRes(DETAILS_BODY));
    const res = await placeDetails(db, "ChIJtest123", "enterprise", {
      fetch,
      env: ENV_ENT,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const provenance = googleCatalogProvenance(res.places[0]!);
    expect(Object.keys(provenance).sort()).toEqual(["contactSource", "externalId", "provider"]);
    expect(provenance).toEqual({
      externalId: "g:ChIJtest123",
      provider: "google",
      contactSource: "google",
    });
    // And the session place itself carries the display fields that must
    // never reach the catalog.
    expect(res.places[0]!.phone).toBe("(510) 843-2739");
  });
});
