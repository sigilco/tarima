/**
 * Venue search provider seam (stream F). Mirrors the channel adapter
 * seam: one interface, one adapter per provider, an injectable fetch so
 * tests never touch the network.
 *
 * Two providers, two roles:
 *   - photon: DISCOVERY. Public, keyless. Returns name, address,
 *     coords and the osm id. Never contact data.
 *   - overpass: ENRICHMENT. Given an osm id, fetches the OSM tags that
 *     can carry a contact (email, phone, website) plus capacity and
 *     opening hours. The public instance is capacity constrained, so
 *     the adapter times out and backs off; a local Overpass is the
 *     post-beta hardening path.
 *
 * Honesty rule: a provider never invents a contact. A venue without a
 * contact lands in the catalog anyway and the board flags it as "no
 * contact" for the user to fill.
 */

/** The id an osm object is cached under: `<type>:<id>` (e.g. `node/123`). */
export type OsmId = string;

/** One venue a provider found. No fabricated fields: absent stays absent. */
export interface VenueCandidate {
  /** Display name as OSM carries it. */
  name: string;
  city: string;
  /** Street address, when the provider returned one. */
  address?: string;
  lat: number;
  lon: number;
  /** `<osm_type>/<osm_id>`, the enrichment and catalog key. */
  externalId: OsmId;
  /** Coarse category (`bar`, `cafe`, `restaurant`, ...). */
  category: string;
}

/** The contact-bearing facts an enrichment can add. Absent means OSM has none. */
export interface VenueDetails {
  externalId: OsmId;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  capacity?: number;
  openingHours?: string;
}

export interface VenueSearchQuery {
  /** A city preset name (`sf`, `malaga`) or a free-text city. */
  city: string;
  /** Category keyword (`bar`, `cafe`, `restaurant`). */
  category: string;
  /** Center point, used when the city has no preset bbox. */
  lat?: number;
  lon?: number;
  /** Explicit bbox override: [minLon, minLat, maxLon, maxLat]. */
  bbox?: [number, number, number, number];
  /** Max results (default 25, providers may cap lower). */
  limit?: number;
}

/** One map provider. `enrich` is overpass-only (optional on the seam). */
export interface VenueProvider {
  id: "photon" | "overpass";
  search(query: VenueSearchQuery): Promise<VenueCandidate[]>;
  enrich?(osmId: OsmId): Promise<VenueDetails>;
}

/** Injectable fetch: tests pass a stub, the adapters default to globalThis.fetch. */
export type FetchImpl = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>;

/** A provider that can discover venues (the discovery half of the seam). */
export interface VenueSearchProvider extends VenueProvider {
  search(query: VenueSearchQuery): Promise<VenueCandidate[]>;
}

/** A provider that can enrich a venue (the enrichment half of the seam). */
export interface VenueEnrichProvider extends VenueProvider {
  enrich(osmId: OsmId): Promise<VenueDetails>;
}
