/**
 * Audit-log helper: immutable, append-only "who did what" events. Audit
 * entries always log at "info" with category ["app", "audit", <action>] and
 * carry userId/target/extra properties so the JSONL sink captures a uniform,
 * greppable trail. Rendering to the events DB table (Stage 2 drizzle schema)
 * is the caller's job; this helper only guarantees the log shape.
 */
import { getLogger } from "./logtape.js";

export interface AuditContext {
  /** Authenticated principal (user id or api key prefix). */
  userId: string;
  /** Object acted on, e.g. "project:<uuid>" or "entity:<uuid>". */
  target: string;
  /** Free-form structured detail (never secrets). */
  extra?: Record<string, unknown>;
}

export function audit(action: string, ctx: AuditContext): void {
  getLogger(["app", "audit", action]).info(action, {
    userId: ctx.userId,
    target: ctx.target,
    ...ctx.extra,
  });
}
