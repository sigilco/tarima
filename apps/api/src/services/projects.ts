/**
 * Project service: plain functions over the drizzle database.
 *
 * Wire shape follows `@tarima/contract` (`projectSchema`):
 *   - `id`, `name` as-is
 *   - `goal` is a free-form JSON record, stored in the `projects.goal`
 *     column (always a JSON object, never null)
 *   - `createdAt` is an ISO string on the wire; the db stores epoch ms
 *
 * Ownership: a project records the caller that created it (`ownerId`),
 * but the read paths are not filtered by owner. The api currently runs
 * as a single organisation, and the parity surface (curl/MCP/UI) needs
 * one shared project list. The owner column is populated so ownership
 * filtering can be added without a schema change.
 */
import { randomUUID } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { projects } from "../db/schema";
import type * as schema from "../db/schema";

export type ApiDb = BetterSQLite3Database<typeof schema>;

/** The project shape the api returns on the wire. */
export interface ProjectWire {
  id: string;
  name: string;
  goal: Record<string, unknown>;
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
    createdAt: toIso(row.createdAt),
  };
}

/** Every project, newest first. Ties broken by id so the order is stable. */
export function listProjects(db: ApiDb): ProjectWire[] {
  return db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt), asc(projects.id))
    .all()
    .map(toWire);
}

/** One project, or undefined when the id is unknown. */
export function getProject(db: ApiDb, id: string): ProjectWire | undefined {
  const row = db.select().from(projects).where(eq(projects.id, id)).get();
  return row ? toWire(row) : undefined;
}

export interface CreateProjectInput {
  name: string;
  goal?: Record<string, unknown>;
  ownerId?: string | null;
}

/** Create a project. The id is generated here, never taken from the wire. */
export function createProject(db: ApiDb, input: CreateProjectInput): ProjectWire {
  const now = Date.now();
  const row: typeof projects.$inferSelect = {
    id: randomUUID(),
    ownerId: input.ownerId ?? null,
    name: input.name,
    description: null,
    goal: input.goal ?? {},
    stage: "brief",
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
 */
export function updateProject(
  db: ApiDb,
  id: string,
  patch: UpdateProjectInput,
): ProjectWire | undefined {
  const current = db.select().from(projects).where(eq(projects.id, id)).get();
  if (!current) return undefined;

  const next = {
    name: patch.name ?? current.name,
    goal: patch.goal ?? current.goal,
    updatedAt: Date.now(),
  };
  db.update(projects).set(next).where(eq(projects.id, id)).run();
  return getProject(db, id);
}
