import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-fsq-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../../db");
const { providerLedger } = await import("../../db/schema");
const { fsqCatalogFields, placeDetails } = await import("./foursquare");
const { ledgerGet } = await import("./ledger");

const ENV = { FSQ_API_KEY: "test-key" } satisfies NodeJS.ProcessEnv;

const FSQ_BODY = {
  fsq_place_id: "5a187743ccad6b307315e6fe",
  name: "Foursquare HQ",
  latitude: 40.741,
  longitude: -73.989,
  location: { formatted_address: "200 W 34th St, New York, NY" },
  timezone: "America/New_York",
  hours: { monday: [["0900", "1700"]] },
  tel: "+12125550100",
  website: "https://foursquare.com",
  rating: 4.5,
  stats: { total_ratings: 1200 },
  price: 2,
};

function fakeFetch(status = 200, body: unknown = FSQ_BODY) {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const impl = (async (url: unknown, init?: RequestInit) => {
    calls.push({
      url: String(url),
      headers: (init?.headers ?? {}) as Record<string, string>,
    });
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
  return { fetch: impl, calls };
}

beforeEach(() => {
  db.delete(providerLedger).run();
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("foursquare placeDetails", () => {
  it("is disabled without FSQ_API_KEY and never fetches", async () => {
    const { fetch, calls } = fakeFetch();
    const res = await placeDetails(db, "fsq123", { fetch, env: {} });
    expect(res).toEqual({ ok: false, reason: "disabled" });
    expect(calls).toHaveLength(0);
  });

  it("sends bearer auth + api version header, parses fields", async () => {
    const { fetch, calls } = fakeFetch();
    const res = await placeDetails(db, "5a187743ccad6b307315e6fe", {
      fetch,
      env: ENV,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.place.name).toBe("Foursquare HQ");
    expect(res.place.phone).toBe("+12125550100");
    expect(res.place.website).toBe("https://foursquare.com");
    expect(res.place.rating).toBe(4.5);
    expect(res.place.totalRatings).toBe(1200);

    expect(calls).toHaveLength(1);
    expect(calls[0]!.headers.Authorization).toBe("Bearer test-key");
    expect(calls[0]!.headers["X-Places-Api-Version"]).toBe("2025-06-17");
    expect(calls[0]!.url).toContain("places-api.foursquare.com/places/5a187743ccad6b307315e6fe");
    expect(calls[0]!.url).not.toContain("test-key");
    expect(ledgerGet(db, "foursquare", "details")).toBe(1);
  });

  it("stops at the daily cap", async () => {
    const { fetch, calls } = fakeFetch();
    const env = { ...ENV, FSQ_PLACES_DAILY_BUDGET: "1" };
    await placeDetails(db, "a", { fetch, env });
    const res = await placeDetails(db, "b", { fetch, env });
    expect(res).toEqual({ ok: false, reason: "over_budget" });
    expect(calls).toHaveLength(1);
  });

  it("maps 404 to not_found", async () => {
    const { fetch } = fakeFetch(404, { error: "not found" });
    const res = await placeDetails(db, "missing", { fetch, env: ENV });
    expect(res).toEqual({ ok: false, reason: "not_found", status: 404 });
  });
});

describe("fsqCatalogFields", () => {
  it("projects only persistable contact fields + provenance", async () => {
    const { fetch } = fakeFetch();
    const res = await placeDetails(db, "x", { fetch, env: ENV });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const fields = fsqCatalogFields(res.place);
    expect(Object.keys(fields).sort()).toEqual(["contactPhone", "contactSource", "website"]);
    expect(fields.contactSource).toBe("fsq");
  });
});
