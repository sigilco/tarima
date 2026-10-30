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
