import { createHash } from "node:crypto";
import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, callerUserId } from "../lib/tarima";
import { outbox, projects } from "@tarima/api/db/schema";

/**
 * The first gated outbound tool (plan SP8): stage a sponsorship/outreach
 * email into tarima's `outbox` journal. The gate is the tool's own
 * `approval: always()` — eve suspends the turn and opens an approval
 * interaction; nothing runs until a person approves on the session's
 * channel (the chat panel's approval card).
 *
 * SAFETY: no SMTP. The execute body only writes an `outbox` row with
 * status `pending`; a human-facing sender job (not this tool) is the
 * only thing that would ever move it to `sent`. Retries are safe: the
 * idempotency key is derived from the inputs, so a replayed call with
 * identical arguments re-reads the same row instead of double-staging.
 *
 * Ownership mirrors `update_task`: the tool only acts for a project the
 * session principal owns; another user's project reads as not_found.
 */
export default defineTool({
  description:
    "Stage an outbound email (e.g. a sponsorship or catering inquiry to a sponsor or venue) in tarima's outbox for review and sending. Requires human approval before it runs. Only works for the caller's own project.",
  inputSchema: z.object({
    projectId: z.string().describe("The project the email belongs to."),
    to: z.string().email().describe("Recipient email address."),
    subject: z.string().min(1).describe("Email subject line."),
    body: z.string().min(1).describe("Email body text."),
  }),
  approval: always(),
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
    const idempotencyKey = createHash("sha256")
      .update([input.projectId, input.to, input.subject, input.body].join("\n"))
      .digest("hex")
      .slice(0, 32);
    const existing = db
      .select({ id: outbox.id, status: outbox.status })
      .from(outbox)
      .where(eq(outbox.idempotencyKey, idempotencyKey))
      .limit(1)
      .all();
    if (existing.length > 0) {
      return {
        staged: false,
        outboxId: existing[0].id,
        status: existing[0].status,
        idempotencyKey,
        note: "An identical message is already staged; nothing was duplicated.",
      };
    }
    const id = crypto.randomUUID();
    db.insert(outbox)
      .values({
        id,
        idempotencyKey,
        type: "email.outreach",
        payload: {
          projectId: input.projectId,
          to: input.to,
          subject: input.subject,
          body: input.body,
          stagedBy: userId,
        },
        status: "pending",
      })
      .run();
    return {
      staged: true,
      outboxId: id,
      status: "pending",
      idempotencyKey,
      to: input.to,
      subject: input.subject,
      note: "Email staged in the outbox; it is not sent until a human sends it.",
    };
  },
});
