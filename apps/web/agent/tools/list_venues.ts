import { defineTool } from "eve/tools";
import { z } from "zod";
import { like } from "drizzle-orm";
import { db, callerUserId } from "../lib/tarima";
import { venueCatalog } from "@tarima/api/db/schema";

/** Venue catalog rows for a city (researched by the venue-search service). */
export default defineTool({
  description:
    "List researched venues from tarima's venue catalog for a city, with capacity, price band, website and verified contact info when present. Tarima never invents contacts: rows without contactEmail/contactPhone genuinely have none.",
  inputSchema: z.object({
    city: z.string().describe("City name, e.g. Berkeley."),
  }),
  async execute(input, ctx) {
    if (!callerUserId(ctx)) return { error: "unauthorized" };
    const rows = db
      .select()
      .from(venueCatalog)
      .where(like(venueCatalog.city, input.city))
      .limit(25)
      .all();
    return {
      city: input.city,
      venues: rows.map((row) => ({
        id: row.id,
        name: row.name,
        ...(row.area ? { area: row.area } : {}),
        ...(row.capacity !== null ? { capacity: row.capacity } : {}),
        ...(row.priceBand ? { priceBand: row.priceBand } : {}),
        source: row.source,
        ...(row.website ? { website: row.website } : {}),
        ...(row.contactEmail ? { contactEmail: row.contactEmail } : {}),
        ...(row.contactPhone ? { contactPhone: row.contactPhone } : {}),
      })),
    };
  },
});
