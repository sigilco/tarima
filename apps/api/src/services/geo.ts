/** Haversine distance in metres between two WGS84 points. */
export function haversineM(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Round an anchor so nearby queries share a cache key. */
export function roundCoord(n: number, decimals = 3): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** Coarse geo cell (~1 km) used as a place_cache key. */
export function geoCell(lat: number, lon: number): string {
  return `${roundCoord(lat, 2)},${roundCoord(lon, 2)}`;
}

const QUERY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const VENUE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const STALE_GRACE_MS = 6 * 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000;
const DEGRADED_TTL_MS = 60 * 1000;

export const CACHE_TTL = {
  query: QUERY_TTL_MS,
  venue: VENUE_TTL_MS,
  staleGrace: STALE_GRACE_MS,
  negative: NEGATIVE_TTL_MS,
  degraded: DEGRADED_TTL_MS,
} as const;
