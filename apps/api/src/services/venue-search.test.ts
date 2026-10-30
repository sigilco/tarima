/**
 * Venue search service tests (stream F).
 *
 * The providers run on stub fetches (the fixtures of
 * `@tarima/venuesearch`), so no test touches the network. The proofs:
 *   - the first search calls Photon once and upserts every result
 *   - the second identical search is one cache read with ZERO fetches
 *   - a stale cache row still answers from the cache and refreshes in
 *     the background (SWR)
 *   - enrichment fills contact columns only when OSM has them, and a
 *     venue without a contact stays without one
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";

const dir = mkdtempSync(join(tmpdir(), "tarima-venuesearch-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { searchCache, venueCatalog } = await import("../db/schema");
const { enrichVenue, normalizeQuery, queryHashOf, searchVenues } = await import("./venue-search");
import { photonProvider } from "@tarima/venuesearch/photon";
import { overpassProvider } from "@tarima/venuesearch/overpass";
import type { FetchImpl } from "@tarima/venuesearch/types";

function fixture(name: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../../../../packages/venuesearch/fixtures/${name}`, import.meta.url)),
    "utf8",
  );
}

/** A counting fetch that answers with a recorded fixture. */
function fixtureFetch(name: string): FetchImpl & { calls: number } {
  const body = fixture(name);
  const impl = (async () => {
    impl.calls++;
    return new Response(body, { status: 200 });
  }) as unknown as FetchImpl & { calls: number };
  impl.calls = 0;
  return impl;
}

let photonFetch: ReturnType<typeof fixtureFetch>;

beforeAll(() => {
  photonFetch = fixtureFetch("photon-malaga.json");
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

function deps(overpassFetch?: FetchImpl) {
  return {
    photon: photonProvider({ fetchImpl: photonFetch }),
    overpass: overpassProvider({
      fetchImpl: overpassFetch ?? (async () => new Response("{}", { status: 200 })),
    }),
  };
}

describe("normalize + hash", () => {
  it("normalizes city case and maps the bbox preset", () => {
    const q = normalizeQuery({ city: "  Malaga ", category: " Bar ", limit: 999 });
    expect(q.city).toBe("Malaga");
    expect(q.category).toBe("bar");
    expect(q.bbox).toEqual([-4.43, 36.69, -4.4, 36.73]);
    expect(q.limit).toBe(25);
  });

  it("hashes equal queries to the same key regardless of spelling", () => {
    const a = queryHashOf(normalizeQuery({ city: "sf", category: "cafe" }));
    const b = queryHashOf(normalizeQuery({ city: "SF", category: "cafe", limit: 25 }));
    expect(a).toBe(b);
  });
});

describe("cache-first search", () => {
  it("the first search calls Photon, the identical second search is zero fetches", async () => {
    const first = await searchVenues(db, { city: "malaga", category: "bar" }, deps());
    expect(first.cache).toBe("miss");
    expect(first.rows.length).toBeGreaterThan(0);
    const callsAfterFirst = photonFetch.calls;
    expect(callsAfterFirst).toBeGreaterThan(0);

    // Every row persisted with its provider identity.
    for (const row of first.rows) {
      expect(row.externalId).toMatch(/^[a-z]+\/\d+$/);
      expect(row.source).toBe(`osm:${row.externalId}`);
    }

    const second = await searchVenues(db, { city: "MALAGA", category: "bar" }, deps());
    expect(second.cache).toBe("hit");
    expect(second.refreshing).toBe(false);
    expect(second.rows.map((row) => row.id)).toEqual(first.rows.map((row) => row.id));
    // The hard assertion: the second search touched no provider.
    expect(photonFetch.calls).toBe(callsAfterFirst);

    // And the cache row exists, keyed on the normalized hash.
    const cached = db.select().from(searchCache).all();
    expect(cached).toHaveLength(1);
  });

  it("a stale cache entry answers immediately and refreshes in the background", async () => {
    // Age the cache row past the query TTL.
    const cached = db.select().from(searchCache).all()[0]!;
    db.update(searchCache)
      .set({ refreshedAt: Date.now() - 8 * 24 * 60 * 60 * 1000 })
      .where(eq(searchCache.queryHash, cached.queryHash))
      .run();

    const background: Array<() => Promise<void>> = [];
    const swrDeps = { ...deps(), background: (work: () => Promise<void>) => background.push(work) };
    const result = await searchVenues(db, { city: "malaga", category: "bar" }, swrDeps);
    expect(result.cache).toBe("hit");
    expect(result.refreshing).toBe(true);
    expect(result.rows.length).toBeGreaterThan(0);
    // The response came back before any refresh ran.
    expect(photonFetch.calls).toBe(1);
    // The refresh is queued, and running it hits Photon and stamps fresh.
    expect(background).toHaveLength(1);
    await background[0]!();
    expect(photonFetch.calls).toBe(2);
    const fresh = db.select().from(searchCache).all()[0]!;
    expect(Date.now() - fresh.refreshedAt).toBeLessThan(60_000);
  });

  it("a provider failure answers empty instead of throwing", async () => {
    const failingDeps = {
      photon: photonProvider({
        fetchImpl: async () => new Response("down", { status: 503 }),
      }),
      overpass: overpassProvider({ fetchImpl: async () => new Response("{}", { status: 200 }) }),
    };
    const result = await searchVenues(db, { city: "berlin", category: "bar" }, failingDeps);
    expect(result.cache).toBe("miss");
    expect(result.rows).toEqual([]);
  });
});

describe("enrichment", () => {
  it("fills the contact columns only from real OSM tags", async () => {
    const overpassFetch: FetchImpl = async () =>
      new Response(
        JSON.stringify({
          elements: [
            {
              type: "node",
              id: 1,
              tags: {
                name: "Bar Cervantes",
                "contact:email": "hola@barcervantes.es",
                "contact:phone": "+34 951 00 00 00",
                website: "https://barcervantes.es",
                capacity: "80",
              },
            },
          ],
        }),
        { status: 200 },
      );
    const search = await searchVenues(db, { city: "malaga", category: "bar" }, deps());
    const target = search.rows[0]!;
    const outcome = await enrichVenue(db, target.id, deps(overpassFetch));
    expect(outcome).toBeDefined();
    expect(outcome!.filled.contactEmail).toBe("hola@barcervantes.es");
    expect(outcome!.filled.contactPhone).toBe("+34 951 00 00 00");
    expect(outcome!.filled.website).toBe("https://barcervantes.es");
    expect(outcome!.filled.capacity).toBe(80);

    const row = db
      .select()
      .from(venueCatalog)
      .all()
      .find((r) => r.id === target.id)!;
    expect(row.contactEmail).toBe("hola@barcervantes.es");
    expect(row.enrichedAt).not.toBeNull();

    // A fresh row is skipped: Overpass is not asked again.
    const skipped = await enrichVenue(db, target.id, deps(overpassFetch));
    expect(skipped!.skipped).toBe("fresh");
  });

  it("a venue without a contact in OSM stays without one", async () => {
    const emptyOverpass: FetchImpl = async () =>
      new Response(JSON.stringify({ elements: [{ type: "node", id: 2, tags: { name: "x" } }] }), {
        status: 200,
      });
    const search = await searchVenues(db, { city: "malaga", category: "bar" }, deps());
    const target = search.rows.at(-1)!;
    const outcome = await enrichVenue(db, target.id, deps(emptyOverpass));
    expect(outcome!.filled).toEqual({});
    const row = db
      .select()
      .from(venueCatalog)
      .all()
      .find((r) => r.id === target.id)!;
    expect(row.contactEmail).toBeNull();
    expect(row.contactPhone).toBeNull();
    expect(row.website).toBeNull();
  });

  it("an enrichment failure is reported, not thrown", async () => {
    const failing: FetchImpl = async () => new Response("at capacity", { status: 502 });
    const search = await searchVenues(db, { city: "malaga", category: "bar" }, deps());
    const target = search.rows[0]!;
    db.update(venueCatalog).set({ enrichedAt: null }).where(eq(venueCatalog.id, target.id)).run();
    const outcome = await enrichVenue(db, target.id, deps(failing));
    expect(outcome!.failed).toMatch(/502/);
  });
});
