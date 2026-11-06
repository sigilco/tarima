/**
 * Entity (chase board row) service: plain functions over the drizzle
 * database.
 *
 * Wire shape follows `@tarima/contract` (`entitySchema`) exactly:
 *   - `id`, `projectId`, `name` as-is
 *   - `contact` (optional email)  -> db `entities.contact_email`
 *   - `channel` (optional)         -> db `entities.goal.channel`
 *   - `missing` (string array)      -> db `entities.goal.missing`
 *   - `status`                      -> db `entities.status`, translated
 *                                     through the status-map module
 *   - `createdAt` / `updatedAt`     -> ISO strings (db stores epoch ms)
 *
 * The `entities.goal` column is therefore the single JSON bag for the
 * wire fields that have no column of their own: `missing` and `channel`
 * live under it as `goal.missing` and `goal.channel`. The db's
 * `entities.result` column is a SIBLING of `goal`, not a key inside it:
 * it holds the outcome of the chase (the fields parsed out of a reply)
 * and has no counterpart on the wire, so it is never returned and never
 * overwritten by these functions.
 */
import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { entities, type EntityStatus } from "../db/schema";
import { toDbStatus, toWireStatus } from "./status-map";
import { toIso, type ApiDb } from "./projects";
import type { ChaseRowState, Channel } from "@tarima/contract";

/** The entity shape the api returns on the wire. */
export interface EntityWire {
  id: string;
  projectId: string;
  name: string;
  contact?: string;
  channel?: Channel;
  status: ChaseRowState;
  missing: string[];
  createdAt: string;
  updatedAt: string;
}

/** Keys the `entities.goal` JSON bag holds. */
interface EntityGoalBag {
  missing?: unknown;
  channel?: unknown;
}

function readMissing(goal: Record<string, unknown>): string[] {
  const bag = goal as EntityGoalBag;
  return Array.isArray(bag.missing)
    ? bag.missing.filter((x): x is string => typeof x === "string")
    : [];
}

function readChannel(goal: Record<string, unknown>): Channel | undefined {
  const bag = goal as EntityGoalBag;
  const channel = bag.channel;
  if (channel === "email" || channel === "telegram" || channel === "manual") return channel;
  return undefined;
}

function toWire(row: typeof entities.$inferSelect): EntityWire {
  const goal = row.goal ?? {};
  const contact = row.contactEmail ?? undefined;
  const channel = readChannel(goal);
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    ...(contact ? { contact } : {}),
    ...(channel ? { channel } : {}),
    status: toWireStatus(row.status),
    missing: readMissing(goal),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

/** Every entity of a project, oldest first (stable by id). */
export function listEntities(db: ApiDb, projectId: string): EntityWire[] {
  return db
    .select()
    .from(entities)
    .where(eq(entities.projectId, projectId))
    .orderBy(asc(entities.createdAt), asc(entities.id))
    .all()
    .map(toWire);
}

/** One entity, or undefined when the id is unknown. */
export function getEntity(db: ApiDb, id: string): EntityWire | undefined {
  const row = db.select().from(entities).where(eq(entities.id, id)).get();
  return row ? toWire(row) : undefined;
}

export interface CreateEntityInput {
  projectId: string;
  name: string;
  contact?: string;
  channel?: Channel;
  status: ChaseRowState;
  missing?: string[];
  /**
   * Explicit creation timestamp. A bulk import passes a distinct
   * millisecond per row so the board keeps the order of the document:
   * rows are sorted by (createdAt, id) and a shared timestamp would
   * leave the order to the random uuid.
   */
  createdAt?: number;
  /**
   * Extra keys merged into the `entities.goal` JSON bag (e.g. a
   * sponsor candidate's website/kind/source). The wire surface only
   * reads `missing` and `channel`; extras are stored, not projected.
   */
  goalExtras?: Record<string, unknown>;
}

/** Create an entity under a project. */
export function createEntity(db: ApiDb, input: CreateEntityInput): EntityWire {
  const now = input.createdAt ?? Date.now();
  const goal: Record<string, unknown> = {
    missing: input.missing ?? [],
    ...(input.goalExtras ?? {}),
  };
  if (input.channel) goal.channel = input.channel;

  const row: typeof entities.$inferSelect = {
    id: randomUUID(),
    projectId: input.projectId,
    name: input.name,
    contactEmail: input.contact ?? null,
    goal,
    result: {},
    status: toDbStatus(input.status),
    createdAt: now,
    updatedAt: now,
  };
  db.insert(entities).values(row).run();
  return toWire(row);
}

export interface UpdateEntityInput {
  name?: string;
  contact?: string;
  channel?: Channel;
  status?: ChaseRowState;
  missing?: string[];
}

/**
 * Patch an entity. Returns undefined when the id is unknown so the
 * caller can answer 404. The `result` column is left untouched.
 */
export function updateEntity(
  db: ApiDb,
  id: string,
  patch: UpdateEntityInput,
): EntityWire | undefined {
  const current = db.select().from(entities).where(eq(entities.id, id)).get();
  if (!current) return undefined;

  const currentGoal = current.goal ?? {};
  const goal: Record<string, unknown> = { ...currentGoal };
  if (patch.missing !== undefined) goal.missing = patch.missing;
  if (patch.channel !== undefined) goal.channel = patch.channel;

  db.update(entities)
    .set({
      name: patch.name ?? current.name,
      contactEmail: patch.contact ?? current.contactEmail,
      status: patch.status ? toDbStatus(patch.status) : current.status,
      goal,
      updatedAt: Date.now(),
    })
    .where(eq(entities.id, id))
    .run();
  return getEntity(db, id);
}

/** Entities of a project in the given db statuses (workflow intake filter). */
export function listEntitiesByStatus(
  db: ApiDb,
  projectId: string,
  statuses: EntityStatus[],
): EntityWire[] {
  if (statuses.length === 0) return [];
  return db
    .select()
    .from(entities)
    .where(and(eq(entities.projectId, projectId), inArray(entities.status, statuses)))
    .orderBy(asc(entities.createdAt), asc(entities.id))
    .all()
    .map(toWire);
}
