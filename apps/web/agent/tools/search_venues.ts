import { defineTool } from "eve/tools";
import { z } from "zod";
import { callerUserId } from "../lib/tarima";
import { searchVenues } from "@tarima/api/services/venue-search";

/** Live venue discovery: Photon geocode + Geoapify Places + catalog upsert. */
export default defineTool({
  description:
    "Search for real venues near a city or landmark (Photon geocode, Geoapify Places, OSM Overpass hedge). Returns distance-ranked rows. Contacts are only those the provider published; missing contacts mean needs_contact, never a guess.",
  inputSchema: z.object({
    city: z.string().describe("City name, e.g. Berkeley."),
    query: z
      .string()
      .optional()
      .describe("Anchor to geocode, e.g. 'UC Berkeley'. Defaults to the city."),
    category: z
      .string()
      .optional()
      .describe("food, cafe, bar, brewery, event, shop. Defaults to food."),
    radiusM: z.number().int().min(50).max(10000).optional(),
    limit: z.number().int().min(1).max(25).optional(),
    ignoreCache: z.boolean().optional(),
  }),
  async execute(input, ctx) {
    if (!callerUserId(ctx)) return { error: "unauthorized" };
    return searchVenues({
      city: input.city,
      query: input.query,
      category: input.category,
      radiusM: input.radiusM,
      limit: input.limit,
      ignoreCache: input.ignoreCache,
    });
  },
});
