import { defineTool } from "eve/tools";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { db, callerUserId } from "../lib/tarima";
import { entities, projects } from "@tarima/api/db/schema";
import { createEntity } from "@tarima/api/services/entities";

/**
 * Add a discovered sponsor/venue candidate to the project board.
 * Internal board write — ungated like `update_task`.
 *
 * Rows are created through `createEntity`, the same service the REST
 * and MCP surfaces use, so an agent-added candidate is byte-identical
 * to an MCP-created one (status `candidate`, contact/channel/missing
 * on the wire shape).
 *
 * Idempotent: a second call with the same project + name (case-
 * insensitive) returns the existing row instead of duplicating it.
 */
export default defineTool({
  description:
    "Add a sponsor or venue candidate to the project board. Idempotent on project+name. Only works for the caller's own project.",
  inputSchema: z.object({
    projectId: z.string().describe("The project the candidate belongs to."),
    name: z.string().min(1).describe("Company or venue name."),
    contactEmail: z.string().email().optional().describe("Public contact email, if known."),
    website: z.string().url().optional().describe("Official website URL."),
    kind: z
      .string()
      .optional()
      .describe("What kind of candidate, e.g. 'ai-vendor', 'venue', 'caterer'."),
    note: z.string().optional().describe("Short note on why this candidate fits."),
  }),
  async execute(input, ctx) {
    const userId = callerUserId(ctx);
    if (!userId) return { error: "unauthorized" };
    const owned = db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, input.projectId), eq(projects.ownerId, userId)))
      .limit(1)
      .all();
    if (owned.length === 0) return { error: "not_found" };

    const existing = db
      .select({ id: entities.id, name: entities.name })
      .from(entities)
      .where(
        and(
          eq(entities.projectId, input.projectId),
          sql`lower(${entities.name}) = lower(${input.name})`,
        ),
      )
      .limit(1)
      .all();
    if (existing.length > 0) {
      return {
        added: false,
        entityId: existing[0]!.id,
        name: existing[0]!.name,
        note: "A candidate with this name already exists on the board; nothing was duplicated.",
      };
    }

    const entity = createEntity(db, {
      projectId: input.projectId,
      name: input.name,
      contact: input.contactEmail,
      channel: input.contactEmail ? "email" : undefined,
      status: "candidate",
      missing: input.contactEmail ? [] : ["contact"],
      goalExtras: {
        source: "agent",
        addedBy: userId,
        ...(input.website ? { website: input.website } : {}),
        ...(input.kind ? { kind: input.kind } : {}),
        ...(input.note ? { note: input.note } : {}),
      },
    });
    return { added: true, entity };
  },
});
