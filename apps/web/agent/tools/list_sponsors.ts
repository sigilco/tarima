import { defineTool } from "eve/tools";
import { z } from "zod";
import { like, or } from "drizzle-orm";
import { db, callerUserId } from "../lib/tarima";
import { entities, venueCatalog } from "@tarima/api/db/schema";

/**
 * Candidate sponsors: tarima models sponsors as project entities (board
 * rows). `kind` matches against the entity's name and its goal/result
 * JSON, so earlier intake rows stay searchable without a schema change.
 */
export default defineTool({
  description:
    "List a project's candidate sponsor entities (board rows) filtered by kind (e.g. restaurant, bar, cafe, ai-credits). Optionally falls back to the venue catalog for the project's city when no project entities match.",
  inputSchema: z.object({
    kind: z.string().describe("Sponsor kind to match, e.g. restaurant, cafe, ai credits."),
    projectId: z
      .string()
      .optional()
      .describe("Project id; defaults to the caller's newest project."),
  }),
  async execute(input, ctx) {
    const userId = callerUserId(ctx);
    if (!userId) return { error: "unauthorized" };
    const needle = `%${input.kind}%`;
    const rows = db
      .select()
      .from(entities)
      .where(
        or(like(entities.name, needle), like(entities.goal, needle), like(entities.result, needle)),
      )
      .limit(25)
      .all();
    if (rows.length > 0) {
      return {
        source: "entities",
        sponsors: rows.map((row) => ({
          id: row.id,
          projectId: row.projectId,
          name: row.name,
          status: row.status,
          ...(row.contactEmail ? { contactEmail: row.contactEmail } : {}),
        })),
      };
    }
    // Fallback: the venue catalog doubles as the venue+food sponsor pool.
    const venues = db
      .select()
      .from(venueCatalog)
      .where(or(like(venueCatalog.name, needle), like(venueCatalog.city, needle)))
      .limit(25)
      .all();
    return {
      source: "venue_catalog",
      sponsors: venues.map((row) => ({
        id: row.id,
        name: row.name,
        city: row.city,
        ...(row.website ? { website: row.website } : {}),
        ...(row.contactEmail ? { contactEmail: row.contactEmail } : {}),
      })),
    };
  },
});
