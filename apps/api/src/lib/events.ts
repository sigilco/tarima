/**
 * Audit-event polling for the board's live updates (Stage 5, T5.2).
 *
 * The engine publishes into the `events` table (the durable audit trail).
 * The board UI needs those changes as a live stream. Rather than teaching
 * every writer to publish into an in-process bus (the engine dispatcher and
 * the webhooks are owned by another stream), the SSE route POLLS the table:
 * every connection asks for the rows created after the last row it saw and
 * streams them. Polling the durable table is the robust option: it works
 * for writes that happen in another process, after a restart, or through
 * any route that forgot to publish.
 *
 * Entity rows can also change without an audit event: the chase worker
 * moves a row's status and bumps `updated_at` without an `events` row.
 * Those changes are surfaced as synthetic `entity.changed` signals read
 * off the entities table, so the board refreshes even when a writer
 * skipped the audit trail.
 *
 * Cost: two indexed SELECTs per connection per tick. The board has a
 * handful of connections at most, and the tick is 2s.
 */
import { and, asc, eq, gte, inArray, or } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { entities, events } from "../db/schema";
import type * as schema from "../db/schema";

export type EventsDb = BetterSQLite3Database<typeof schema>;

/** One audit event, as streamed to the browser. */
export interface BoardEvent {
  id: string;
  type: string;
  subjectType: string;
  subjectId: string;
  data: Record<string, unknown>;
  createdAt: number;
}

/**
 * The watermark of a stream. Ids are random uuids, so they cannot order
 * rows: the poll compares `createdAt` inclusive (`>=`) and remembers the
 * ids already delivered at the boundary millisecond, so two rows written
 * in the same tick are never skipped or double-sent.
 */
export interface EventCursor {
  /** Epoch ms of the newest row seen (inclusive). */
  since: number;
  /** Event ids already delivered at `since`; re-read by the >= poll. */
  seen: ReadonlySet<string>;
}

/** A cursor that starts at "now": the stream only delivers future rows. */
export function cursorNow(): EventCursor {
  return { since: Date.now(), seen: new Set() };
}

/** The ids of the entities of a project (the rows of its board). */
function listEntityIds(db: EventsDb, projectId: string): string[] {
  return db
    .select({ id: entities.id })
    .from(entities)
    .where(eq(entities.projectId, projectId))
    .all()
    .map((row) => row.id);
}

/** Map a raw `events` row to the streamed shape. */
function toBoardEvent(row: typeof events.$inferSelect): BoardEvent {
  return {
    id: row.id,
    type: row.type,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    data: (row.data ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt,
  };
}

/**
 * Every audit event of a project created at or after the cursor, oldest
 * first, minus the ones already delivered.
 *
 * The project scope matches the project itself (`subjectType` "project")
 * and its entities: entity events carry the entity id, so the project's
 * entity ids are the second half of the filter (an IN list, not one OR
 * per row: a 500-row board must not build a 500-arm WHERE).
 */
export function listProjectEvents(
  db: EventsDb,
  projectId: string,
  entityIds: readonly string[],
  cursor: EventCursor,
  limit = 100,
): BoardEvent[] {
  const projectScope = and(eq(events.subjectType, "project"), eq(events.subjectId, projectId));
  const scope =
    entityIds.length > 0
      ? or(
          projectScope,
          and(eq(events.subjectType, "entity"), inArray(events.subjectId, [...entityIds])),
        )
      : projectScope;

  // Boundary rows are re-read every tick, so fetch a little more than the
  // limit and drop the delivered ones after the select.
  const rows = db
    .select()
    .from(events)
    .where(and(gte(events.createdAt, cursor.since), scope))
    .orderBy(asc(events.createdAt))
    .limit(limit + cursor.seen.size)
    .all();

  return rows
    .map(toBoardEvent)
    .filter((event) => !cursor.seen.has(event.id))
    .slice(0, limit);
}

/**
 * Synthetic `entity.changed` signals: entities of the project whose
 * `updated_at` moved at or after the cursor. One stable id per change
 * (`entity.changed:<id>:<updatedAt>`) so the dedup set treats them exactly
 * like audit rows.
 */
function listEntityChangedEvents(
  db: EventsDb,
  projectId: string,
  cursor: EventCursor,
  limit = 100,
): BoardEvent[] {
  const rows = db
    .select({ id: entities.id, updatedAt: entities.updatedAt })
    .from(entities)
    .where(and(eq(entities.projectId, projectId), gte(entities.updatedAt, cursor.since)))
    .orderBy(asc(entities.updatedAt))
    .limit(limit + cursor.seen.size)
    .all();

  return rows
    .map((row) => ({
      id: `entity.changed:${row.id}:${row.updatedAt}`,
      type: "entity.changed",
      subjectType: "entity",
      subjectId: row.id,
      data: {},
      createdAt: row.updatedAt,
    }))
    .filter((event) => !cursor.seen.has(event.id))
    .slice(0, limit);
}

/** One poll tick: audit events plus entity-change signals, oldest first. */
export function pollBoardEvents(
  db: EventsDb,
  projectId: string,
  cursor: EventCursor,
  limit = 100,
): BoardEvent[] {
  const entityIds = listEntityIds(db, projectId);
  const audit = listProjectEvents(db, projectId, entityIds, cursor, limit);
  const changed = listEntityChangedEvents(db, projectId, cursor, limit);
  return [...audit, ...changed].toSorted((a, b) => a.createdAt - b.createdAt).slice(0, limit);
}

/** The newest watermark of the delivered rows, so the next poll asks for newer. */
export function advanceCursor(cursor: EventCursor, delivered: readonly BoardEvent[]): EventCursor {
  if (delivered.length === 0) return cursor;
  const newest = delivered.reduce((max, event) => Math.max(max, event.createdAt), cursor.since);
  const seen = new Set(delivered.filter((e) => e.createdAt === newest).map((e) => e.id));
  return { since: newest, seen };
}
