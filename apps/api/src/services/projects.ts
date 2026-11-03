/**
 * Project service: plain functions over the drizzle database.
 *
 * Wire shape follows `@tarima/contract` (`projectSchema`):
 *   - `id`, `name` as-is
 *   - `goal` is a free-form JSON record, stored in the `projects.goal`
 *     column (always a JSON object, never null)
 *   - `createdAt` is an ISO string on the wire; the db stores epoch ms
 *
 * Ownership: a project records the caller that created it (`ownerId`).
 * The read paths take an optional `ownerId`: when it is given, only the
 * projects of that owner are returned and a project of another owner
 * reads as unknown. The browser surface (`/api/ui/*`) always passes the
 * session user, so a tester only ever sees their own boards. The Bearer
 * surface (curl/MCP/CLI) is the machine parity surface and keeps the
 * global list, because a key is scoped by capability, not by project.
 *
 * The brief: `projects.goal.brief` holds the structured brief of the
 * event (contract `briefSchema`). It is validated here, in the service,
 * so the browser surface and the Bearer surface cannot drift.
 */
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import * as v from "valibot";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { projectGoalSchema } from "@tarima/contract";
import { projects } from "../db/schema";
import type * as schema from "../db/schema";

export type ApiDb = BetterSQLite3Database<typeof schema>;

/** The project shape the api returns on the wire. */
export interface ProjectWire {
  id: string;
  name: string;
  goal: Record<string, unknown>;
  /** Approval-flow stage (contract PROJECT_STAGES). */
  stage: string;
  createdAt: string;
}

/** Epoch ms to the ISO string the contract expects. */
export function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

function toWire(row: typeof projects.$inferSelect): ProjectWire {
  return {
    id: row.id,
    name: row.name,
    goal: row.goal ?? {},
    stage: row.stage,
    createdAt: toIso(row.createdAt),
  };
}

/**
 * Every project, newest first. Ties broken by id so the order is stable.
 *
 * With an `ownerId`, only that owner's projects are listed. Without one
 * (the Bearer machine surface), every project is listed.
 */
export function listProjects(db: ApiDb, ownerId?: string | null): ProjectWire[] {
  const rows = ownerId
    ? db
        .select()
        .from(projects)
        .where(eq(projects.ownerId, ownerId))
        .orderBy(desc(projects.createdAt), asc(projects.id))
        .all()
    : db.select().from(projects).orderBy(desc(projects.createdAt), asc(projects.id)).all();
  return rows.map(toWire);
}

/**
 * One project, or undefined when the id is unknown.
 *
 * With an `ownerId`, a project owned by somebody else reads as unknown,
 * so the caller answers 404 and never leaks the row.
 */
export function getProject(
  db: ApiDb,
  id: string,
  ownerId?: string | null,
): ProjectWire | undefined {
  const row = ownerId
    ? db
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.ownerId, ownerId)))
        .get()
    : db.select().from(projects).where(eq(projects.id, id)).get();
  return row ? toWire(row) : undefined;
}

/**
 * True when the goal record satisfies the contract (brief is optional).
 *
 * The goal is loose on purpose: only the `brief` key is contract-owned,
 * the engine and older rows put other keys in there. A goal that carries
 * a malformed brief does not satisfy it.
 */
export function isValidGoal(goal: Record<string, unknown> | undefined): boolean {
  return v.is(projectGoalSchema, goal ?? {});
}

export interface CreateProjectInput {
  name: string;
  goal?: Record<string, unknown>;
  ownerId?: string | null;
}

/** Create a project. The id is generated here, never taken from the wire. */
export function createProject(db: ApiDb, input: CreateProjectInput): ProjectWire {
  if (!isValidGoal(input.goal)) {
    throw new Error("invalid_goal");
  }
  const now = Date.now();
  const row: typeof projects.$inferSelect = {
    id: randomUUID(),
    ownerId: input.ownerId ?? null,
    name: input.name,
    description: null,
    goal: input.goal ?? {},
    stage: "brief",
    sendApprovedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(projects).values(row).run();
  return toWire(row);
}

export interface UpdateProjectInput {
  name?: string;
  goal?: Record<string, unknown>;
}

/**
 * Patch a project. Returns undefined when the id is unknown so the
 * caller can answer 404 instead of silently succeeding.
 *
 * A `goal` patch replaces the whole record: the brief lives under its
 * namespaced key inside it, so callers that only want to change the
 * name omit `goal` and callers that rewrite the brief send the merged
 * record. An invalid brief in a new goal is rejected.
 */
export function updateProject(
  db: ApiDb,
  id: string,
  patch: UpdateProjectInput,
): ProjectWire | undefined {
  const current = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!current) return undefined;

  if (patch.goal !== undefined && !isValidGoal(patch.goal)) return undefined;

  const next = {
    name: patch.name ?? current.name,
    goal: patch.goal ?? current.goal,
    updatedAt: Date.now(),
  };
  db.update(projects).set(next).where(eq(projects.id, id)).run();
  return getProject(db, id);
}
