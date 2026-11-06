import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-venue-search-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.GEOAPIFY_API_KEY = "test-fixture-key";

const { db } = await import("../db");
const { venueCatalog } = await import("../db/schema");
const { fixtureFetch } = await import("./place-fixtures");
const { searchVenues, setVenueSearchDeps, upsertHits, dedupHits } = await import("./venue-search");
const { haversineM } = await import("./geo");

describe("searchVenues", () => {
  beforeAll(() => {
    setVenueSearchDeps({ geoapifyKey: "test-fixture-key" });
  });

  beforeEach(() => {
    db.delete(venueCatalog).run();
  });

  it("returns Berkeley venues with distance and caches the second call", async () => {
    const first = fixtureFetch();
    setVenueSearchDeps({ fetch: first.fetch, geoapifyKey: "test-fixture-key" });
    const miss = await searchVenues({
      city: "Berkeley",
      query: "UC Berkeley",
      category: "food",
      radiusM: 1500,
    });
    expect(miss.cache).toBe("miss");
    expect(miss.venues.length).toBeGreaterThan(0);
    for (const row of miss.venues) {
      expect(row.distanceM).toBeGreaterThanOrEqual(0);
      expect(row.distanceM ?? 0).toBeLessThanOrEqual(1500);
      if (row.latitude != null && row.longitude != null) {
        expect(
          haversineM({ lat: 37.8719, lon: -122.2585 }, { lat: row.latitude, lon: row.longitude }),
        ).toBeLessThanOrEqual(1500);
      }
    }
    const providerCalls = first.calls.filter(
      (c) => c.includes("photon") || c.includes("geoapify") || c.includes("overpass"),
    ).length;
    expect(providerCalls).toBeGreaterThan(0);

    const second = fixtureFetch();
    setVenueSearchDeps({ fetch: second.fetch, geoapifyKey: "test-fixture-key" });
    const hit = await searchVenues({
      city: "Berkeley",
      query: "UC Berkeley",
      category: "food",
      radiusM: 1500,
    });
    expect(hit.cache).toBe("hit");
    expect(hit.venues.length).toBe(miss.venues.length);
    expect(second.calls).toHaveLength(0);
  });

  it("never fabricates contacts", async () => {
    const { fetch } = fixtureFetch();
    setVenueSearchDeps({ fetch, geoapifyKey: "test-fixture-key" });
    const out = await searchVenues({
      city: "Berkeley",
      query: "venues near UC Berkeley",
      radiusM: 1500,
    });
    for (const row of out.venues) {
      if (row.contactEmail || row.contactPhone) {
        expect(row.contactSource).toBeTruthy();
        expect(row.contactSource).not.toBe("human");
      }
      if (row.needsContact) {
        expect(row.contactEmail).toBeUndefined();
      }
    }
  });

  it("dedups by external_id and by normalized name within 50 m", () => {
    const a = {
      externalId: "a",
      name: "Triple Rock Brewery",
      city: "Berkeley",
      latitude: 37.8734,
      longitude: -122.2687,
      provider: "geoapify",
    };
    const b = {
      externalId: "b",
      name: "triple-rock brewery",
      city: "Berkeley",
      latitude: 37.87341,
      longitude: -122.26871,
      provider: "overpass",
    };
    const c = {
      externalId: "a",
      name: "Triple Rock Brewery",
      city: "Berkeley",
      latitude: 37.8734,
      longitude: -122.2687,
      provider: "geoapify",
      contactPhone: "+1 510 8432739",
    };
    const out = dedupHits([a, b, c]);
    expect(out).toHaveLength(1);
    expect(out[0].contactPhone).toBe("+1 510 8432739");
  });

  it("upserts by external_id", () => {
    const now = Date.now();
    const ids = upsertHits(
      [
        {
          externalId: "node/1",
          name: "Press Coffee",
          city: "Berkeley",
          latitude: 37.87,
          longitude: -122.26,
          provider: "geoapify",
        },
        {
          externalId: "node/1",
          name: "Press Coffee",
          city: "Berkeley",
          latitude: 37.87,
          longitude: -122.26,
          provider: "geoapify",
          website: "https://example.com",
        },
      ],
      now,
    );
    expect(new Set(ids).size).toBe(1);
    expect(db.select().from(venueCatalog).all()).toHaveLength(1);
  });
});
