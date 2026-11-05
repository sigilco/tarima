import { defineTool } from "eve/tools";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, callerUserId } from "../lib/tarima";
import { entities, entityStatuses, projects } from "@tarima/api/db/schema";

/**
 * The one write path: move a board row's status. Ownership is enforced
 * against the session principal (users.id); another user's row reads as
 * not_found.
 */
export default defineTool({
  description:
    "Update a project board row's (task's) status in tarima. Valid statuses: candidate, pending, intake, chasing, await_reply, parsed, validated, updated, notified, done, failed.",
  inputSchema: z.object({
    taskId: z.string().describe("The entity (board row) id."),
    status: z.enum(entityStatuses),
  }),
  async execute(input, ctx) {
    const userId = callerUserId(ctx);
    if (!userId) return { error: "unauthorized" };
    const rows = db
      .select({ id: entities.id, status: entities.status })
      .from(entities)
      .innerJoin(projects, and(eq(entities.projectId, projects.id), eq(projects.ownerId, userId)))
      .where(eq(entities.id, input.taskId))
      .limit(1)
      .all();
    const row = rows[0];
    if (!row) return { error: "not_found" };
    const status = input.status;
    db.update(entities)
      .set({ status, updatedAt: Date.now() })
      .where(eq(entities.id, input.taskId))
      .run();
    return { id: row.id, from: row.status, to: status };
  },
});
