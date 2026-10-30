/**
 * Venue search service (stream F): the cache-first wrapper around the
 * `@tarima/venuesearch` providers.
 *
 * Flow of a search:
 *   1. normalize the query (trim, lower city, known bbox preset,
 *      category), hash it
 *   2. cache hit -> return the catalog rows of the cached venue ids,
 *      zero provider calls
 *   3. miss -> call Photon, upsert EVERY result into `venue_catalog`
 *      (`onConflictDoNothing` on `external_id`, the same idempotency
 *      discipline the engine's journal uses), record the query in
 *      `search_cache`, return the rows
 *
 * TTL policy: venue rows are fresh for 30 days (OSM churn on POIs is
 * low), search queries for 7 days. A stale cache row still answers
 * immediately and the refresh runs after responding (SWR): the caller
 * gets cached data and a newer copy lands for the next query.
 *
 * Enrichment is a separate, lazy step per curated candidate: Overpass
 * is asked for the contact tags of one osm id and the catalog row is
 * updated in place, so the next search of that venue is fully cached.
 *
 * Honesty rule: a provider that returns no contact fills nothing. The
 * venue is created anyway and the board flags it as needing a contact.
 * No fabricated contact data, ever.
 */
import { createHash, randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { cityPreset } from "@tarima/venuesearch/cities";
import type { OsmId, VenueEnrichProvider, VenueSearchProvider } from "@tarima/venuesearch/types";
import type { ApiDb } from "./projects";
import { searchCache, venueCatalog } from "../db/schema";

/** Queries are fresh for 7 days. */
export const QUERY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Venue rows are fresh for 30 days. */
export const VENUE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** The provider pair the service calls through. */
export interface VenueSearchDeps {
  photon: VenueSearchProvider;
  overpass: VenueEnrichProvider;
  /** Runs work after the response (the SWR refresh). Defaults to fire-and-forget. */
  background?(work: () => Promise<void>): void;
}

/** The normalized query the cache is keyed on. */
export interface NormalizedQuery {
  city: string;
  category: string;
  bbox?: [number, number, number, number];
  limit: number;
}

/** Lower, trim, map the city to its bbox preset, default the limit. */
export function normalizeQuery(query: {
  city: string;
  category: string;
  bbox?: [number, number, number, number];
  limit?: number;
}): NormalizedQuery {
  const city = query.city.trim();
  const preset = cityPreset(city);
  return {
    city,
    category: query.category.trim().toLowerCase(),
    ...((query.bbox ?? preset?.bbox) ? { bbox: query.bbox ?? preset!.bbox } : {}),
    limit: Math.min(Math.max(query.limit ?? 25, 1), 25),
  };
}

/** The stable cache key of a normalized query. */
export function queryHashOf(query: NormalizedQuery): string {
  const material = [
    query.city.toLowerCase(),
    query.category,
    query.bbox ? query.bbox.join(",") : "",
    String(query.limit),
  ].join("|");
  return createHash("sha256").update(material).digest("hex").slice(0, 32);
}

/** One cached venue row, in the shape the routes and curation read. */
export type VenueRow = typeof venueCatalog.$inferSelect;

/** The result of a search: the rows plus where they came from. */
export interface SearchResult {
  rows: VenueRow[];
  cache: "hit" | "miss";
  /** True when the cached answer was stale and a refresh was scheduled. */
  refreshing: boolean;
}

/**
 * The cache-first search. Never throws on a provider failure: a search
 * that cannot reach Photon returns the cached rows or an empty list,
 * because a flaky provider must not 500 a board.
 */
export async function searchVenues(
  db: ApiDb,
  query: {
    city: string;
    category: string;
    bbox?: [number, number, number, number];
    limit?: number;
  },
  deps: VenueSearchDeps,
): Promise<SearchResult> {
  const normalized = normalizeQuery(query);
  const hash = queryHashOf(normalized);
  const cached = db.select().from(searchCache).where(eq(searchCache.queryHash, hash)).get();

  if (cached) {
    const fresh = Date.now() - cached.refreshedAt < QUERY_TTL_MS;
    const rows = rowsForCacheEntry(db, cached.venueIds);
    if (!fresh) {
      // SWR: answer from the cache now, refresh behind the response.
      runInBackground(deps, () => refreshCacheEntry(db, normalized, hash, deps));
      return { rows, cache: "hit", refreshing: true };
    }
    return { rows, cache: "hit", refreshing: false };
  }

  // Miss: discover, upsert everything, cache the query.
  try {
    const candidates = await deps.photon.search({
      city: normalized.city,
      category: normalized.category,
      ...(normalized.bbox ? { bbox: normalized.bbox } : {}),
      limit: normalized.limit,
    });
    const ids = upsertCandidates(db, candidates, normalized.city);
    const now = Date.now();
    db.insert(searchCache)
      .values({
        queryHash: hash,
        query: JSON.stringify(normalized),
        venueIds: ids,
        refreshedAt: now,
      })
      .onConflictDoUpdate({
        target: searchCache.queryHash,
        set: { venueIds: ids, refreshedAt: now },
      })
      .run();
    return { rows: rowsForCacheEntry(db, ids), cache: "miss", refreshing: false };
  } catch (err) {
    console.warn("[venue-search] provider failed:", err instanceof Error ? err.message : err);
    return { rows: [], cache: "miss", refreshing: false };
  }
}

/** The catalog rows of a cache entry, in the order the search returned them. */
function rowsForCacheEntry(db: ApiDb, ids: string[]): VenueRow[] {
  if (ids.length === 0) return [];
  const rows = db.select().from(venueCatalog).where(inArray(venueCatalog.externalId, ids)).all();
  const byId = new Map(rows.filter((row) => row.externalId).map((row) => [row.externalId!, row]));
  return ids.map((id) => byId.get(id)).filter((row) => row !== undefined);
}

/** Upsert candidates into the catalog (idempotent on external_id). */
function upsertCandidates(
  db: ApiDb,
  candidates: Array<{
    name: string;
    city: string;
    address?: string;
    externalId: OsmId;
    category: string;
  }>,
  fallbackCity: string,
): string[] {
  const ids: string[] = [];
  for (const candidate of candidates) {
    const city = candidate.city || fallbackCity;
    const existing = db
      .select()
      .from(venueCatalog)
      .where(eq(venueCatalog.externalId, candidate.externalId))
      .get();
    if (existing) {
      ids.push(candidate.externalId);
      continue;
    }
    // Insert with the provider identity. `onConflictDoNothing` without a
    // target swallows every unique conflict, so a venue that is already
    // in the catalog under another row (same city and name) does not
    // break the search.
    db.insert(venueCatalog)
      .values({
        id: randomUUID(),
        city,
        name: candidate.name,
        area: candidate.address ?? null,
        source: `osm:${candidate.externalId}`,
        externalId: candidate.externalId,
        createdAt: Date.now(),
      })
      .onConflictDoNothing()
      .run();
    // The insert may have lost to the (city, name) unique index: the
    // venue is already in the catalog under another provider id. Adopt
    // it when it carries none, so the cache entry resolves.
    const inserted = db
      .select()
      .from(venueCatalog)
      .where(eq(venueCatalog.externalId, candidate.externalId))
      .get();
    if (!inserted) {
      const same = db
        .select()
        .from(venueCatalog)
        .where(and(eq(venueCatalog.city, city), eq(venueCatalog.name, candidate.name)))
        .get();
      if (same && !same.externalId) {
        db.update(venueCatalog)
          .set({ externalId: candidate.externalId })
          .where(eq(venueCatalog.id, same.id))
          .run();
      }
    }
    ids.push(candidate.externalId);
  }
  return ids;
}

/** Re-run a stale query against Photon and stamp the cache row fresh. */
async function refreshCacheEntry(
  db: ApiDb,
  normalized: NormalizedQuery,
  hash: string,
  deps: VenueSearchDeps,
): Promise<void> {
  const candidates = await deps.photon.search({
    city: normalized.city,
    category: normalized.category,
    ...(normalized.bbox ? { bbox: normalized.bbox } : {}),
    limit: normalized.limit,
  });
  const ids = upsertCandidates(db, candidates, normalized.city);
  db.update(searchCache)
    .set({ venueIds: ids, refreshedAt: Date.now() })
    .where(eq(searchCache.queryHash, hash))
    .run();
}

/** Fire-and-forget a background refresh, never surfacing an error. */
function runInBackground(deps: VenueSearchDeps, work: () => Promise<void>): void {
  const run = () =>
    work().catch((err) =>
      console.warn(
        "[venue-search] background refresh failed:",
        err instanceof Error ? err.message : err,
      ),
    );
  if (deps.background) deps.background(run);
  else void run();
}

/** The outcome of a lazy enrichment pass on one venue. */
export interface EnrichOutcome {
  externalId: OsmId;
  /** The fields Overpass actually had (absent stays absent). */
  filled: Partial<Pick<VenueRow, "contactEmail" | "contactPhone" | "website" | "capacity">>;
  /** The catalog row was enriched before (within the venue TTL). */
  skipped?: "fresh";
  failed?: string;
}

/**
 * Lazily enrich one catalog row through Overpass.
 *
 * The catalog is the cache: the enrichment writes the contact columns
 * on the row, so every later read (and every later search that returns
 * this venue) sees the contact without a second provider call. A row
 * enriched inside the venue TTL is skipped: the public Overpass is at
 * capacity more often than not, and a fresh row is good enough.
 */
export async function enrichVenue(
  db: ApiDb,
  venueId: string,
  deps: VenueSearchDeps,
): Promise<EnrichOutcome | undefined> {
  const row = db.select().from(venueCatalog).where(eq(venueCatalog.id, venueId)).get();
  if (!row) return undefined;
  if (!row.externalId) {
    return { externalId: "", filled: {}, skipped: "fresh" };
  }
  if (row.enrichedAt !== null && Date.now() - row.enrichedAt < VENUE_TTL_MS) {
    return { externalId: row.externalId, filled: {}, skipped: "fresh" };
  }
  try {
    const details = await deps.overpass.enrich(row.externalId);
    const filled: EnrichOutcome["filled"] = {};
    if (details.contactEmail && !row.contactEmail) filled.contactEmail = details.contactEmail;
    if (details.contactPhone && !row.contactPhone) filled.contactPhone = details.contactPhone;
    if (details.website && !row.website) filled.website = details.website;
    if (details.capacity && row.capacity === null) filled.capacity = details.capacity;
    if (Object.keys(filled).length > 0) {
      db.update(venueCatalog)
        .set({ ...filled, url: row.url ?? details.website ?? null, enrichedAt: Date.now() })
        .where(eq(venueCatalog.id, venueId))
        .run();
    } else {
      db.update(venueCatalog)
        .set({ enrichedAt: Date.now() })
        .where(eq(venueCatalog.id, venueId))
        .run();
    }
    return { externalId: row.externalId, filled };
  } catch (err) {
    const message = err instanceof Error ? err.message : "overpass failed";
    return { externalId: row.externalId, filled: {}, failed: message };
  }
}

/** The venues of a city that still have no contact (the "no contact" bucket). */
export function venuesWithoutContact(db: ApiDb, city: string): VenueRow[] {
  return db
    .select()
    .from(venueCatalog)
    .where(and(eq(venueCatalog.city, city.trim())))
    .all()
    .filter((row) => !row.contactEmail);
}
