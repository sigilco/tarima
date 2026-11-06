/** Seed venue catalog row, matched against a brief by the curate service. */
import * as v from "valibot";

export const PRICE_BANDS = ["low", "mid", "high", "premium"] as const;
export const priceBandSchema = v.picklist(PRICE_BANDS);
export type PriceBand = v.InferOutput<typeof priceBandSchema>;

export const venueSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  city: v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.minLength(1)),
  area: v.optional(v.string()),
  capacity: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
  priceBand: v.optional(priceBandSchema),
  /** Where the row came from (research doc, manual). */
  source: v.string(),
  url: v.optional(v.pipe(v.string(), v.url())),
});
export type Venue = v.InferOutput<typeof venueSchema>;

/**
 * Stream F additions (additive after the contract freeze): the provider
 * fields of a catalog row and the search results.
 *
 * The honesty rule: a venue without a contact is a normal row, not an
 * error. `contactEmail` stays absent, and the row is reported in the
 * "no contact" bucket so the user can fill it. Nothing is ever
 * fabricated.
 */

/**
 * Provenance for a stored contact. LLM-derived values are forbidden;
 * `llm_verified` means the LLM only pointed at text that was verified
 * verbatim on the venue's own page (tier-3 fallback).
 */
export const CONTACT_SOURCES = [
  "osm",
  "overture",
  "fsq",
  "geoapify",
  "photon",
  "jsonld",
  "page_text",
  "llm_verified",
  "human",
] as const;
export const contactSourceSchema = v.picklist(CONTACT_SOURCES);
export type ContactSource = v.InferOutput<typeof contactSourceSchema>;

/** A catalog venue as the search surface returns it. */
export const catalogVenueSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  city: v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.minLength(1)),
  area: v.optional(v.string()),
  capacity: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
  priceBand: v.optional(priceBandSchema),
  source: v.string(),
  url: v.optional(v.pipe(v.string(), v.url())),
  /** The provider identity (`node/123`), when the row came from a provider. */
  externalId: v.optional(v.string()),
  /** The contact OSM knows. Absent when OSM has none. */
  contactEmail: v.optional(v.pipe(v.string(), v.email())),
  contactPhone: v.optional(v.string()),
  website: v.optional(v.pipe(v.string(), v.url())),
  /** True when the row still needs a contact the user has to fill. */
  needsContact: v.boolean(),
  latitude: v.optional(v.number()),
  longitude: v.optional(v.number()),
  /** Metres from the search anchor, when both points are known. */
  distanceM: v.optional(v.pipe(v.number(), v.minValue(0))),
  provider: v.optional(v.string()),
  openingHours: v.optional(v.string()),
  contactSource: v.optional(contactSourceSchema),
  rating: v.optional(v.number()),
});
export type CatalogVenue = v.InferOutput<typeof catalogVenueSchema>;

/** The request of a venue search. */
export const venueSearchRequestSchema = v.object({
  city: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
  /** Free-text query used to geocode the anchor when lat/lng are absent. */
  query: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200))),
  /** Category keyword: bar, cafe, restaurant, ... */
  category: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100))),
  limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(25))),
  radiusM: v.optional(v.pipe(v.number(), v.integer(), v.minValue(50), v.maxValue(10000))),
  latitude: v.optional(v.number()),
  longitude: v.optional(v.number()),
  /** Bypass the query cache (agent "search again"). */
  ignoreCache: v.optional(v.boolean()),
});
export type VenueSearchRequest = v.InferInput<typeof venueSearchRequestSchema>;

/**
 * A Google Places result as the search surface may show it IN-SESSION.
 * Places ToS §3.2.3: display fields may be returned to the caller but
 * never persisted — this shape exists only inside a search response.
 */
export const googlePlaceSessionSchema = v.object({
  placeId: v.pipe(v.string(), v.minLength(1)),
  displayName: v.optional(v.string()),
  formattedAddress: v.optional(v.string()),
  location: v.optional(v.object({ lat: v.number(), lon: v.number() })),
  phone: v.optional(v.string()),
  website: v.optional(v.string()),
  rating: v.optional(v.number()),
  types: v.optional(v.array(v.string())),
});
export type GooglePlaceSession = v.InferOutput<typeof googlePlaceSessionSchema>;

/** The answer of a venue search: the rows and where they came from. */
export const venueSearchResponseSchema = v.object({
  city: v.string(),
  category: v.string(),
  /** `hit` = served from the cache, `miss` = the provider was called. */
  cache: v.picklist(["hit", "miss"]),
  /** A stale hit answered from the cache and refreshes in the background. */
  refreshing: v.boolean(),
  venues: v.array(catalogVenueSchema),
  /**
   * Why the paid-escalation tier (Google Places / Foursquare) did or
   * did not run on this call, e.g. "cache_hit", "hits=20>=5",
   * "thin_results google_text=ok:4 fsq_search=ok:2". A reason string,
   * never an error.
   */
  escalation: v.optional(v.string()),
  /**
   * Session-only Google Places results when the escalation tier ran.
   * Never persisted (Places ToS); absent when Google is disabled or
   * the tier did not run.
   */
  googlePlaces: v.optional(v.array(googlePlaceSessionSchema)),
  /** How many shortlisted venues the tier-2 crawl enriched this call. */
  enriched: v.optional(v.number()),
});
export type VenueSearchResponse = v.InferOutput<typeof venueSearchResponseSchema>;

/** The request that fills the contact of one catalog row by hand. */
export const venueContactRequestSchema = v.object({
  contactEmail: v.optional(v.pipe(v.string(), v.trim(), v.email())),
  contactPhone: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(50))),
  website: v.optional(v.pipe(v.string(), v.trim(), v.url())),
});
export type VenueContactRequest = v.InferInput<typeof venueContactRequestSchema>;

/** The answer of a contact update: the row as it stands now. */
export const venueContactResponseSchema = v.object({
  venue: catalogVenueSchema,
});
export type VenueContactResponse = v.InferOutput<typeof venueContactResponseSchema>;
