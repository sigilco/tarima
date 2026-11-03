/**
 * In-app inbox messages (Stage B, channels stream).
 *
 * Read side of the `user_messages` table (the notify fanout is the
 * write side). The board shows the unread counter, the settings page
 * shows the list. Messages are per user, newest first, and the list is
 * capped: an inbox that grows without end is a bug somewhere else, but
 * the read path must not pay for it.
 */
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { ApiDb } from "./projects";
import { userMessages } from "../db/schema";

/** How many messages the list endpoint returns at most. */
const MESSAGES_LIMIT = 50;

/** The wire shape of one inbox message. */
export interface MessageWire {
  id: string;
  projectId: string | null;
  kind: "status_change" | "approval_needed" | "digest";
  summary: string;
  read: boolean;
  createdAt: string;
}

function toWire(row: typeof userMessages.$inferSelect): MessageWire {
  return {
    id: row.id,
    projectId: row.projectId,
    kind: row.kind,
    summary: row.summary,
    read: row.readAt !== null,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

/** The inbox of a user, newest first, capped at `MESSAGES_LIMIT`. */
export function listMessages(db: ApiDb, userId: string): MessageWire[] {
  return db
    .select()
    .from(userMessages)
    .where(eq(userMessages.userId, userId))
    .orderBy(desc(userMessages.createdAt))
    .limit(MESSAGES_LIMIT)
    .all()
    .map(toWire);
}

/** How many messages the user has not read yet. */
export function unreadCount(db: ApiDb, userId: string): number {
  const rows = db
    .select({ id: userMessages.id })
    .from(userMessages)
    .where(and(eq(userMessages.userId, userId), isNull(userMessages.readAt)))
    .all();
  return rows.length;
}

/**
 * Mark messages read. Without ids every unread message is marked (the
 * "mark all" button). Unknown or already-read ids are no-ops.
 */
export function markMessagesRead(db: ApiDb, userId: string, ids?: string[]): void {
  if (ids && ids.length > 0) {
    db.update(userMessages)
      .set({ readAt: Date.now() })
      .where(and(eq(userMessages.userId, userId), inArray(userMessages.id, ids)))
      .run();
    return;
  }
  db.update(userMessages)
    .set({ readAt: Date.now() })
    .where(and(eq(userMessages.userId, userId), isNull(userMessages.readAt)))
    .run();
}
