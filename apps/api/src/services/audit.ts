/**
 * Audit feed service: the read side of the eve mirror tables
 * (`agent_events`, `approvals`) for the workspace Audit tab.
 *
 * Both tables are keyed by `principal_id` — the tarima user id the
 * session auth stamped — so the feed is scoped to the caller and never
 * leaks another user's agent activity. Payloads stay in the db; the
 * wire shape carries only what the tab renders.
 */
import { desc, eq } from "drizzle-orm";
import { agentEvents, approvals } from "../db/schema";
import type { ApiDb } from "./projects";

export interface AuditApprovalRow {
  id: string;
  sessionId: string;
  toolName: string;
  status: string;
  projectId: string | null;
  decidedBy: string | null;
  decidedAt: number | null;
  createdAt: number;
}

export interface AuditEventRow {
  sessionId: string;
  type: string;
  createdAt: number;
}

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function clampLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT);
}

/** The caller's approval decisions, newest first. */
export function listAuditApprovals(
  db: ApiDb,
  principalId: string,
  limit?: number,
): AuditApprovalRow[] {
  return db
    .select({
      id: approvals.id,
      sessionId: approvals.sessionId,
      toolName: approvals.toolName,
      status: approvals.status,
      projectId: approvals.projectId,
      decidedBy: approvals.decidedBy,
      decidedAt: approvals.decidedAt,
      createdAt: approvals.createdAt,
    })
    .from(approvals)
    .where(eq(approvals.principalId, principalId))
    .orderBy(desc(approvals.createdAt), desc(approvals.id))
    .limit(clampLimit(limit))
    .all();
}

/** The caller's mirrored agent facts, newest first. */
export function listAuditEvents(db: ApiDb, principalId: string, limit?: number): AuditEventRow[] {
  return db
    .select({
      sessionId: agentEvents.sessionId,
      type: agentEvents.type,
      createdAt: agentEvents.createdAt,
    })
    .from(agentEvents)
    .where(eq(agentEvents.principalId, principalId))
    .orderBy(desc(agentEvents.createdAt), desc(agentEvents.sessionId))
    .limit(clampLimit(limit))
    .all();
}
