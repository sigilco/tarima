import { createHash, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  catalogVenueSchema,
  venueSearchRequestSchema,
  venueSearchResponseSchema,
  type CatalogVenue,
  type GooglePlaceSession,
  type VenueSearchRequest,
  type VenueSearchResponse,
} from "@tarima/contract";
import * as v from "valibot";
import { db } from "../db";
import { placeCache, searchCache, venueCatalog } from "../db/schema";
import { CACHE_TTL, geoCell, haversineM, normalizeName, roundCoord } from "./geo";
import { enrichVenueContacts, crawlBudgetFromEnv } from "./enrich";
import { geocodeGeoapify, searchGeoapifyPlaces } from "./providers/geoapify";
import {
  OverpassBudgetError,
  OverpassCircuitOpenError,
  searchOverpass,
} from "./providers/overpass";
import { geocodePhoton } from "./providers/photon";
import { honestContact } from "./providers/honest-contact";
import {
  fsqCatalogFields,
  placeDetails as fsqPlaceDetails,
  searchPlaces as fsqSearchPlaces,
  type FsqPlaceDetails,
} from "./providers/foursquare";
import {
  googlePlacesConfig,
  searchText as googleSearchText,
  type GooglePlace,
} from "./providers/googleplaces";
import type { GeoPoint, InjectedFetch, PlaceHit } from "./providers/types";

const DEFAULT_RADIUS = 1500;
const DEDUP_M = 50;
const DEFAULT_LIMIT = 20;
/** Below this many tier-1 hits the paid escalation tier may run. */
const ESCALATE_MIN_HITS = 5;

export type VenueSearchDeps = {
  fetch?: InjectedFetch;
  now?: () => number;
  geoapifyKey?: string;
  /** Env for provider flags/keys (Google, FSQ, cauce, budgets). */
  env?: NodeJS.ProcessEnv;
  /** Crawl-delay sleep for the tier-2 enrich pass (tests pass a noop). */
  sleep?: (ms: number) => Promise<void>;
  /** Shortlist size for the tier-2 enrich pass; env TARIMA_PLACE_ENRICH_TOP_K, default 5. */
  enrichTopK?: number;
};

let deps: VenueSearchDeps = {};

export function setVenueSearchDeps(next: VenueSearchDeps): void {
  deps = next;
}

function fetchImpl(): InjectedFetch {
  return deps.fetch ?? globalThis.fetch;
}

function nowMs(): number {
  return deps.now?.() ?? Date.now();
}

function geoapifyKey(): string {
  return deps.geoapifyKey ?? process.env.GEOAPIFY_API_KEY ?? "";
}

export function queryHash(input: {
  query: string;
  city: string;
  category: string;
  radiusM: number;
  lat?: number;
  lon?: number;
}): string {
  const preimage = JSON.stringify({
    q: input.query.trim().toLowerCase(),
    city: input.city.trim().toLowerCase(),
    category: input.category.trim().toLowerCase(),
    radius: input.radiusM,
    lat: input.lat !== undefined ? roundCoord(input.lat) : null,
    lon: input.lon !== undefined ? roundCoord(input.lon) : null,
  });
  return createHash("sha256").update(preimage).digest("hex");
}

function toCatalog(row: typeof venueCatalog.$inferSelect, distanceM?: number): CatalogVenue {
  const contactEmail = row.contactEmail ?? undefined;
  const contactPhone = row.contactPhone ?? undefined;
  const website = row.website ?? undefined;
  const parsed = v.parse(catalogVenueSchema, {
    id: row.id,
    city: row.city,
    name: row.name,
    ...(row.area ? { area: row.area } : {}),
    ...(row.capacity ? { capacity: row.capacity } : {}),
    ...(row.priceBand ? { priceBand: row.priceBand } : {}),
    source: row.source,
    ...(row.url ? { url: row.url } : {}),
    ...(row.externalId ? { externalId: row.externalId } : {}),
    ...(contactEmail ? { contactEmail } : {}),
    ...(contactPhone ? { contactPhone } : {}),
    ...(website ? { website } : {}),
    needsContact: !(contactEmail || contactPhone),
    ...(row.latitude != null ? { latitude: row.latitude } : {}),
    ...(row.longitude != null ? { longitude: row.longitude } : {}),
    ...(distanceM !== undefined ? { distanceM } : {}),
    ...(row.provider ? { provider: row.provider } : {}),
    ...(row.openingHours ? { openingHours: row.openingHours } : {}),
    ...(row.contactSource
      ? { contactSource: row.contactSource as CatalogVenue["contactSource"] }
      : {}),
    ...(row.rating != null ? { rating: row.rating } : {}),
  });
  return parsed;
}

export function dedupHits(hits: PlaceHit[]): PlaceHit[] {
  const byExt = new Map<string, PlaceHit>();
  for (const hit of hits) {
    const prev = byExt.get(hit.externalId);
    if (!prev) {
      byExt.set(hit.externalId, hit);
      continue;
    }
    byExt.set(hit.externalId, mergeHit(prev, hit));
  }
  const list = [...byExt.values()];
  const kept: PlaceHit[] = [];
  for (const hit of list) {
    const twin = kept.find(
      (k) =>
        normalizeName(k.name) === normalizeName(hit.name) &&
        haversineM(
          { lat: k.latitude, lon: k.longitude },
          { lat: hit.latitude, lon: hit.longitude },
        ) < DEDUP_M,
    );
    if (twin) {
      const idx = kept.indexOf(twin);
      kept[idx] = mergeHit(twin, hit);
      continue;
    }
    kept.push(hit);
  }
  return kept;
}

function mergeHit(a: PlaceHit, b: PlaceHit): PlaceHit {
  return {
    ...a,
    website: a.website ?? b.website,
    contactEmail: a.contactEmail ?? b.contactEmail,
    contactPhone: a.contactPhone ?? b.contactPhone,
    openingHours: a.openingHours ?? b.openingHours,
    capacity: a.capacity ?? b.capacity,
    contactSource: a.contactSource ?? b.contactSource,
  };
}

export function upsertHits(hits: PlaceHit[], now: number): string[] {
  const ids: string[] = [];
  for (const hit of hits) {
    const existingExt = hit.externalId
      ? db.select().from(venueCatalog).where(eq(venueCatalog.externalId, hit.externalId)).get()
      : undefined;
    const existingName = db
      .select()
      .from(venueCatalog)
      .where(and(eq(venueCatalog.city, hit.city), eq(venueCatalog.name, hit.name)))
      .get();
    const existing = existingExt ?? existingName;
    if (existing) {
      if (
        existing.latitude != null &&
        existing.longitude != null &&
        haversineM(
          { lat: existing.latitude, lon: existing.longitude },
          { lat: hit.latitude, lon: hit.longitude },
        ) > DEDUP_M &&
        normalizeName(existing.name) === normalizeName(hit.name)
      ) {
        // Same name, far apart: keep the stored row (city+name unique).
        ids.push(existing.id);
        continue;
      }
      db.update(venueCatalog)
        .set({
          area: hit.area ?? existing.area,
          capacity: hit.capacity ?? existing.capacity,
          url: hit.website ?? existing.url,
          externalId: hit.externalId ?? existing.externalId,
          contactEmail: hit.contactEmail ?? existing.contactEmail,
          contactPhone: hit.contactPhone ?? existing.contactPhone,
          website: hit.website ?? existing.website,
          latitude: hit.latitude,
          longitude: hit.longitude,
          provider: hit.provider,
          openingHours: hit.openingHours ?? existing.openingHours,
          contactSource: hit.contactSource ?? existing.contactSource,
          lastVerifiedAt: now,
        })
        .where(eq(venueCatalog.id, existing.id))
        .run();
      ids.push(existing.id);
      continue;
    }
    const id = randomUUID();
    db.insert(venueCatalog)
      .values({
        id,
        city: hit.city,
        name: hit.name,
        area: hit.area ?? null,
        capacity: hit.capacity ?? null,
        source: hit.provider,
        url: hit.website ?? null,
        externalId: hit.externalId,
        contactEmail: hit.contactEmail ?? null,
        contactPhone: hit.contactPhone ?? null,
        website: hit.website ?? null,
        latitude: hit.latitude,
        longitude: hit.longitude,
        provider: hit.provider,
        openingHours: hit.openingHours ?? null,
        contactSource: hit.contactSource ?? null,
        lastVerifiedAt: now,
        createdAt: now,
      })
      .run();
    ids.push(id);
  }
  return ids;
}

/** Campus centroid used in the Berkeley OSM research (not Photon's east-shifted point). */
const BERKELEY_CAMPUS = { lat: 37.8719, lon: -122.2585 };

function maybeCampusBias(point: GeoPoint, query: string, city: string): GeoPoint {
  const blob = `${point.label ?? ""} ${query} ${city}`.toLowerCase();
  if (blob.includes("berkeley") && blob.includes("university")) {
    return { ...BERKELEY_CAMPUS, city: point.city ?? city, label: point.label };
  }
  return point;
}

async function geocodeAnchor(
  query: string,
  city: string,
  fetchFn: InjectedFetch,
): Promise<GeoPoint> {
  const photon = await geocodePhoton(query || city, fetchFn);
  if (photon) return maybeCampusBias({ ...photon, city: photon.city ?? city }, query, city);
  const key = geoapifyKey();
  if (key) {
    const hedge = await geocodeGeoapify(query || city, key, fetchFn);
    if (hedge) return maybeCampusBias({ ...hedge, city: hedge.city ?? city }, query, city);
  }
  throw new Error("geocode_failed");
}

function writeQueryCache(opts: {
  hash: string;
  query: string;
  ids: string[];
  payload: string;
  now: number;
  empty: boolean;
  degraded: boolean;
}): void {
  const ttl = opts.degraded
    ? CACHE_TTL.degraded
    : opts.empty
      ? CACHE_TTL.negative
      : CACHE_TTL.query;
  db.insert(searchCache)
    .values({
      queryHash: opts.hash,
      query: opts.query,
      venueIds: opts.ids,
      payload: opts.payload,
      kind: "venue_search",
      expiresAt: opts.now + ttl,
      degraded: opts.degraded ? 1 : 0,
      createdAt: opts.now,
      refreshedAt: opts.now,
    })
    .onConflictDoUpdate({
      target: searchCache.queryHash,
      set: {
        venueIds: opts.ids,
        payload: opts.payload,
        expiresAt: opts.now + ttl,
        degraded: opts.degraded ? 1 : 0,
        refreshedAt: opts.now,
      },
    })
    .run();
}

function writePlaceCache(
  center: GeoPoint,
  category: string,
  radiusM: number,
  hits: PlaceHit[],
  now: number,
  source: string,
): void {
  const cell = geoCell(center.lat, center.lon);
  db.insert(placeCache)
    .values({
      cell,
      category,
      radiusM,
      payload: JSON.stringify(hits),
      source,
      providerRunAt: now,
      expiresAt: now + CACHE_TTL.query,
      stale: 0,
    })
    .onConflictDoUpdate({
      target: [placeCache.cell, placeCache.category],
      set: {
        radiusM,
        payload: JSON.stringify(hits),
        source,
        providerRunAt: now,
        expiresAt: now + CACHE_TTL.query,
        stale: 0,
      },
    })
    .run();
}

function readCachedCenter(payload: string | null, city: string): GeoPoint {
  if (!payload) return { lat: 37.8719, lon: -122.2585, city };
  try {
    const parsed = JSON.parse(payload) as { center?: GeoPoint };
    if (parsed.center && Number.isFinite(parsed.center.lat) && Number.isFinite(parsed.center.lon)) {
      return { ...parsed.center, city: parsed.center.city ?? city };
    }
  } catch {
    // fall through
  }
  return { lat: 37.8719, lon: -122.2585, city };
}

function rowsFromIds(
  ids: string[],
  center: GeoPoint,
  radiusM: number,
  now: number,
): CatalogVenue[] {
  const venues: CatalogVenue[] = [];
  for (const id of ids) {
    const row = db.select().from(venueCatalog).where(eq(venueCatalog.id, id)).get();
    if (!row) continue;
    if (row.lastVerifiedAt != null && now - row.lastVerifiedAt > CACHE_TTL.venue) continue;
    if (row.latitude == null || row.longitude == null) continue;
    const distanceM = Math.round(haversineM(center, { lat: row.latitude, lon: row.longitude }));
    if (distanceM > radiusM) continue;
    venues.push(toCatalog(row, distanceM));
  }
  venues.sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0));
  return venues;
}

async function providerSearch(opts: {
  center: GeoPoint;
  radiusM: number;
  category: string;
  limit: number;
  fetchFn: InjectedFetch;
  now: number;
}): Promise<{ hits: PlaceHit[]; degraded: boolean }> {
  const key = geoapifyKey();
  let geoHits: PlaceHit[] = [];
  let degraded = false;
  if (key) {
    try {
      geoHits = await searchGeoapifyPlaces({
        center: opts.center,
        radiusM: opts.radiusM,
        category: opts.category,
        limit: opts.limit,
        apiKey: key,
        fetch: opts.fetchFn,
      });
    } catch {
      degraded = true;
    }
  }
  let overHits: PlaceHit[] = [];
  if (geoHits.length < 5) {
    try {
      overHits = await searchOverpass({
        center: opts.center,
        radiusM: opts.radiusM,
        category: opts.category,
        fetch: opts.fetchFn,
        now: opts.now,
      });
    } catch (err) {
      if (
        err instanceof OverpassCircuitOpenError ||
        err instanceof OverpassBudgetError ||
        err instanceof Error
      ) {
        degraded = true;
      }
    }
  }
  const hits = dedupHits([...geoHits, ...overHits]).filter((h) => {
    const d = haversineM(opts.center, { lat: h.latitude, lon: h.longitude });
    return d <= opts.radiusM;
  });
  return { hits, degraded };
}

// ---------------------------------------------------------------------------
// Paid escalation tier (runs ONLY when tier-1 hits are thin).
// Google Places results stay session-only (Places ToS); Foursquare hits are
// ordinary licensed POI data and persist through the normal upsert.
// ---------------------------------------------------------------------------

function envOf(): NodeJS.ProcessEnv {
  return deps.env ?? process.env;
}

function envInt(env: NodeJS.ProcessEnv, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function fsqPlaceToHit(place: FsqPlaceDetails, fallbackCity: string): PlaceHit | null {
  if (!place.name || place.latitude === undefined || place.longitude === undefined) return null;
  const contact = honestContact({
    phone: place.phone,
    website: place.website,
    source: "fsq",
  });
  return {
    externalId: `fsq:${place.fsqPlaceId}`,
    name: place.name,
    city: fallbackCity,
    latitude: place.latitude,
    longitude: place.longitude,
    website: contact.website,
    contactPhone: contact.phone,
    provider: "foursquare",
    contactSource: contact.source,
  };
}

function googleToSession(place: GooglePlace): GooglePlaceSession {
  return {
    placeId: place.placeId,
    ...(place.displayName ? { displayName: place.displayName } : {}),
    ...(place.formattedAddress ? { formattedAddress: place.formattedAddress } : {}),
    ...(place.location ? { location: place.location } : {}),
    ...(place.phone ? { phone: place.phone } : {}),
    ...(place.website ? { website: place.website } : {}),
    ...(place.rating !== undefined ? { rating: place.rating } : {}),
    ...(place.types ? { types: place.types } : {}),
  };
}

async function runEscalation(opts: {
  center: GeoPoint;
  radiusM: number;
  query: string;
  limit: number;
  thinCount: number;
  fetchFn: InjectedFetch;
  now: number;
}): Promise<{ fsqHits: PlaceHit[]; google: GooglePlaceSession[]; reason: string }> {
  const env = envOf();
  const parts: string[] = [`thin_results(${opts.thinCount}<${ESCALATE_MIN_HITS})`];

  // Google Places text search — gated by GOOGLE_PLACES_ENABLED inside the
  // provider; every live call is counted in provider_ledger and refused
  // past GOOGLE_PLACES_DAILY_BUDGET. Session-only output.
  const gcfg = googlePlacesConfig(env);
  const g = await googleSearchText(
    db,
    {
      textQuery: opts.query,
      latitude: opts.center.lat,
      longitude: opts.center.lon,
      radiusM: opts.radiusM,
      pageSize: opts.limit,
    },
    gcfg.fieldTier,
    { fetch: opts.fetchFn, env, purpose: "live", now: new Date(opts.now) },
  );
  let google: GooglePlaceSession[] = [];
  if (g.ok) {
    google = g.places.slice(0, opts.limit).map(googleToSession);
    parts.push(`google_text=ok:${g.places.length}${g.cached ? "(session)" : ""}`);
  } else {
    parts.push(`google_text=${g.reason}`);
  }

  // Foursquare search — gated by FSQ_API_KEY; licensed POI data that may
  // persist. Same provider_ledger daily cap as FSQ details.
  const f = await fsqSearchPlaces(
    db,
    {
      latitude: opts.center.lat,
      longitude: opts.center.lon,
      radiusM: opts.radiusM,
      query: opts.query,
      limit: opts.limit,
    },
    { fetch: opts.fetchFn, env, now: new Date(opts.now) },
  );
  let fsqHits: PlaceHit[] = [];
  if (f.ok) {
    fsqHits = f.places
      .map((p) => fsqPlaceToHit(p, opts.center.city ?? "unknown"))
      .filter((h): h is PlaceHit => h !== null);
    parts.push(`fsq_search=ok:${f.places.length}`);
  } else {
    parts.push(`fsq_search=${f.reason}`);
  }

  return { fsqHits, google, reason: parts.join(" ") };
}

// ---------------------------------------------------------------------------
// Tier-2/3 enrichment: FSQ details for fsq:-keyed rows, then the cauce
// crawl for contact info on the top-K shortlist lacking contact.
// ---------------------------------------------------------------------------

/** Fill null contact columns from an FSQ place-details payload. */
function applyFsqDetails(venueId: string, place: FsqPlaceDetails, now: number): void {
  const row = db.select().from(venueCatalog).where(eq(venueCatalog.id, venueId)).get();
  if (!row) return;
  const fields = fsqCatalogFields(place);
  const set: Partial<typeof venueCatalog.$inferInsert> = {};
  if (fields.contactPhone && !row.contactPhone) set.contactPhone = fields.contactPhone;
  if (fields.website && !row.website) set.website = fields.website;
  if (place.rating != null && row.rating == null) set.rating = place.rating;
  // contact_source="fsq" only when the phone (the contact field FSQ
  // supplies) was actually written and no provenance exists yet.
  if (set.contactPhone && !row.contactSource) set.contactSource = "fsq";
  if (Object.keys(set).length === 0) return;
  db.update(venueCatalog)
    .set({ ...set, enrichedAt: now })
    .where(eq(venueCatalog.id, venueId))
    .run();
}

async function enrichShortlist(opts: {
  ids: string[];
  center: GeoPoint;
  radiusM: number;
  fetchFn: InjectedFetch;
  now: number;
}): Promise<number> {
  const env = envOf();
  const topK = deps.enrichTopK ?? envInt(env, "TARIMA_PLACE_ENRICH_TOP_K", 5);
  if (topK <= 0 || opts.ids.length === 0) return 0;

  const rows = opts.ids
    .map((id) => db.select().from(venueCatalog).where(eq(venueCatalog.id, id)).get())
    .filter((r): r is NonNullable<typeof r> => r != null)
    .map((row) => ({
      row,
      distanceM:
        row.latitude != null && row.longitude != null
          ? haversineM(opts.center, { lat: row.latitude, lon: row.longitude })
          : Number.POSITIVE_INFINITY,
    }))
    .filter(({ distanceM }) => distanceM <= opts.radiusM)
    .filter(({ row }) => !(row.contactEmail && row.contactPhone))
    // Only enrichable rows: the crawl needs a website, the FSQ details
    // pass needs an fsq:-keyed external id. Sorting stays by distance.
    .filter(
      ({ row }) => Boolean(row.website?.trim()) || row.externalId?.startsWith("fsq:") === true,
    )
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, topK);
  if (rows.length === 0) return 0;

  // FSQ details pass for rows discovered through the FSQ arm
  // (external_id "fsq:<fsq_place_id>") — one billed call each, ledger-capped.
  for (const { row } of rows) {
    if (!row.externalId?.startsWith("fsq:")) continue;
    if (row.contactEmail && row.contactPhone) continue;
    const res = await fsqPlaceDetails(db, row.externalId.slice(4), {
      fetch: opts.fetchFn,
      env,
      now: new Date(opts.now),
    });
    if (res.ok) applyFsqDetails(row.id, res.place, opts.now);
  }

  // Tier-2 crawl: shared per-run budget, robots-checked, honest contacts.
  const venues = rows.map(({ row }) => {
    const fresh = db.select().from(venueCatalog).where(eq(venueCatalog.id, row.id)).get() ?? row;
    return {
      id: fresh.id,
      name: fresh.name,
      website: fresh.website,
      contactEmail: fresh.contactEmail,
      contactPhone: fresh.contactPhone,
    };
  });
  const results = await enrichVenueContacts(db, venues, {
    fetch: opts.fetchFn,
    env,
    budget: crawlBudgetFromEnv(env),
    sleep: deps.sleep,
  });
  return results.filter((r) => r.enriched).length;
}

export async function searchVenues(
  raw: VenueSearchRequest,
  extra?: { ignoreCache?: boolean },
): Promise<VenueSearchResponse> {
  const input = v.parse(venueSearchRequestSchema, raw);
  const category = input.category ?? "food";
  const radiusM = input.radiusM ?? DEFAULT_RADIUS;
  const limit = input.limit ?? DEFAULT_LIMIT;
  const query = input.query ?? input.city;
  const fetchFn = fetchImpl();
  const now = nowMs();
  const ignoreCache = extra?.ignoreCache ?? input.ignoreCache ?? false;

  const hash = queryHash({
    query,
    city: input.city,
    category,
    radiusM,
    lat: input.latitude,
    lon: input.longitude,
  });

  if (!ignoreCache) {
    const cached = db.select().from(searchCache).where(eq(searchCache.queryHash, hash)).get();
    if (cached) {
      const expires = cached.expiresAt ?? cached.refreshedAt + CACHE_TTL.query;
      const stale = now > expires;
      const withinGrace = now <= expires + CACHE_TTL.staleGrace;
      const emptyNegative = (cached.venueIds?.length ?? 0) === 0;
      const negativeFresh = emptyNegative && now <= expires;
      if ((!stale || withinGrace) && (!emptyNegative || negativeFresh)) {
        const cachedCenter = readCachedCenter(cached.payload, input.city);
        const venues = rowsFromIds(cached.venueIds ?? [], cachedCenter, radiusM, now);
        return v.parse(venueSearchResponseSchema, {
          city: input.city,
          category,
          cache: "hit",
          refreshing: stale && withinGrace,
          venues: venues.slice(0, limit),
          escalation: "cache_hit",
        });
      }
    }
  }

  let center: GeoPoint;
  if (input.latitude != null && input.longitude != null) {
    center = { lat: input.latitude, lon: input.longitude, city: input.city };
  } else {
    center = await geocodeAnchor(query, input.city, fetchFn);
  }

  const { hits, degraded } = await providerSearch({
    center,
    radiusM,
    category,
    limit,
    fetchFn,
    now,
  });

  // Paid escalation tier: only when tier-1 results are thin. Google
  // Places stays session-only; Foursquare hits join the catalog upsert.
  let allHits = hits;
  let googlePlaces: GooglePlaceSession[] | undefined;
  let escalation: string;
  if (hits.length < ESCALATE_MIN_HITS) {
    const esc = await runEscalation({
      center,
      radiusM,
      query,
      limit,
      thinCount: hits.length,
      fetchFn,
      now,
    });
    escalation = esc.reason;
    googlePlaces = esc.google.length > 0 ? esc.google : undefined;
    const fsqHits = esc.fsqHits.filter((h) => {
      const d = haversineM(center, { lat: h.latitude, lon: h.longitude });
      return d <= radiusM;
    });
    if (fsqHits.length > 0) {
      allHits = dedupHits([...hits, ...fsqHits]);
    }
  } else {
    escalation = `sufficient(hits=${hits.length}>=${ESCALATE_MIN_HITS})`;
  }

  const ids = upsertHits(allHits, now);
  writeQueryCache({
    hash,
    query,
    ids,
    payload: JSON.stringify({ center, hits: allHits.length }),
    now,
    empty: allHits.length === 0,
    degraded,
  });
  writePlaceCache(center, category, radiusM, allHits, now, allHits[0]?.provider ?? "geoapify");

  // Tier-2/3 enrichment on the top-K shortlist lacking contact.
  const enriched = await enrichShortlist({ ids, center, radiusM, fetchFn, now });

  const venues = rowsFromIds(ids, center, radiusM, now).slice(0, limit);
  return v.parse(venueSearchResponseSchema, {
    city: center.city ?? input.city,
    category,
    cache: "miss",
    refreshing: false,
    venues,
    escalation,
    ...(googlePlaces ? { googlePlaces } : {}),
    ...(enriched > 0 ? { enriched } : {}),
  });
}
