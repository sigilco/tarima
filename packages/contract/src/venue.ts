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
});
export type CatalogVenue = v.InferOutput<typeof catalogVenueSchema>;

/** The request of a venue search. */
export const venueSearchRequestSchema = v.object({
  city: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
  /** Category keyword: bar, cafe, restaurant, ... */
  category: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100))),
  limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(25))),
});
export type VenueSearchRequest = v.InferInput<typeof venueSearchRequestSchema>;

/** The answer of a venue search: the rows and where they came from. */
export const venueSearchResponseSchema = v.object({
  city: v.string(),
  category: v.string(),
  /** `hit` = served from the cache, `miss` = the provider was called. */
  cache: v.picklist(["hit", "miss"]),
  /** A stale hit answered from the cache and refreshes in the background. */
  refreshing: v.boolean(),
  venues: v.array(catalogVenueSchema),
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
