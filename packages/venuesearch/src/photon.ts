/**
 * Photon adapter (photon.komoot.io): the discovery provider.
 *
 * Public, keyless, no card. Discovery only: the response carries name,
 * address, coordinates and the osm id, never a contact. The contact
 * comes from the Overpass enrichment (per venue, lazily).
 *
 * The adapter is pure over the injected fetch: the unit tests feed it
 * recorded responses and never touch the network.
 */
import { cityDisplayName, cityPreset } from "./cities";
import type {
  FetchImpl,
  OsmId,
  VenueCandidate,
  VenueSearchProvider,
  VenueSearchQuery,
} from "./types";

/** The public Photon endpoint. */
export const PHOTON_BASE_URL = "https://photon.komoot.io/api/";

/** Photon caps the result page; the beta asks for a small page. */
const MAX_LIMIT = 25;

/** The bits of the Photon feature collection the adapter reads. */
interface PhotonProperties {
  osm_type?: string;
  osm_id?: number | string;
  osm_key?: string;
  osm_value?: string;
  name?: string;
  street?: string;
  housenumber?: string;
  locality?: string;
  district?: string;
  city?: string;
  postcode?: string;
  country?: string;
}

interface PhotonFeature {
  type?: string;
  properties?: PhotonProperties;
  geometry?: { type?: string; coordinates?: [number, number] };
}

interface PhotonResponse {
  type?: string;
  features?: PhotonFeature[];
}

export interface PhotonOptions {
  /** The fetch to use. Defaults to the global one. */
  fetchImpl?: FetchImpl;
  /** The endpoint. Overridable so a mirror or a stub can serve it. */
  baseUrl?: string;
  /** Request timeout in ms (default 10s). */
  timeoutMs?: number;
}

/**
 * Build the Photon query url for a search.
 *
 * The bbox pins the search to the city, and the `osm_tag` filter keeps
 * the results to the category the brief asked for. Both are omitted
 * when the caller did not supply enough information, so Photon does its
 * own geocoding.
 */
export function photonUrl(query: VenueSearchQuery, baseUrl = PHOTON_BASE_URL): string {
  const url = new URL(baseUrl);
  const category = query.category.trim();
  if (category) {
    url.searchParams.set("q", category);
    // `amenity:<category>` is the OSM tag filter Photon understands.
    url.searchParams.set("osm_tag", `amenity:${category}`);
  }
  const bbox = query.bbox ?? cityPreset(query.city)?.bbox;
  if (bbox) url.searchParams.set("bbox", bbox.join(","));
  if (query.lat !== undefined && query.lon !== undefined) {
    url.searchParams.set("lat", String(query.lat));
    url.searchParams.set("lon", String(query.lon));
  }
  const limit = Math.min(Math.max(query.limit ?? MAX_LIMIT, 1), MAX_LIMIT);
  url.searchParams.set("limit", String(limit));
  return url.toString();
}

/** The osm id of a Photon feature: `<type>/<id>` (e.g. `node/9684320117`). */
export function osmIdOf(properties: PhotonProperties): OsmId | undefined {
  if (!properties.osm_type || properties.osm_id === undefined) return undefined;
  // Lowercase, because the Overpass query syntax wants `node/123`.
  return `${String(properties.osm_type).toLowerCase()}/${properties.osm_id}`;
}

/** The street address of a feature, when OSM has one. */
function addressOf(properties: PhotonProperties): string | undefined {
  const street = properties.street?.trim();
  const number = properties.housenumber?.trim();
  if (street && number) return `${street} ${number}`;
  if (street) return street;
  return undefined;
}

/**
 * Map a Photon response to candidates. Features without a name, a
 * geometry or an osm id are dropped: a venue the catalog cannot key is
 * a venue the next search would duplicate.
 */
export function photonToCandidates(
  payload: PhotonResponse,
  query: VenueSearchQuery,
): VenueCandidate[] {
  const features = payload.features ?? [];
  const fallbackCity = cityDisplayName(query.city);
  const out: VenueCandidate[] = [];
  for (const feature of features) {
    const properties = feature.properties ?? {};
    const coords = feature.geometry?.coordinates;
    const name = properties.name?.trim();
    if (!name || !coords || coords.length < 2) continue;
    const externalId = osmIdOf(properties);
    if (!externalId) continue;
    const address = addressOf(properties);
    out.push({
      name,
      city: properties.city?.trim() || fallbackCity,
      ...(address ? { address } : {}),
      lat: coords[1]!,
      lon: coords[0]!,
      externalId,
      category: properties.osm_value?.trim() || query.category.trim(),
    });
  }
  return out;
}

/** The Photon discovery provider. */
export function photonProvider(options: PhotonOptions = {}): VenueSearchProvider {
  const fetchImpl = options.fetchImpl ?? ((url, init) => globalThis.fetch(url, init));
  const baseUrl = options.baseUrl ?? PHOTON_BASE_URL;
  const timeoutMs = options.timeoutMs ?? 10_000;
  return {
    id: "photon",
    async search(query: VenueSearchQuery): Promise<VenueCandidate[]> {
      const url = photonUrl(query, baseUrl);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetchImpl(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`photon responded ${res.status}`);
        const payload = (await res.json()) as PhotonResponse;
        return photonToCandidates(payload, query);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
