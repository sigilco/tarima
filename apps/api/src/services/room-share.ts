/**
 * Room share link service: stored, revocable tokens for the negotiation room.
 *
 * Pattern ported from Brioso:
 * - 192-bit opaque random token (24 bytes hex)
 * - One idempotent live link per project room
 * - 7-day default expiry (negotiations have time bounds; remintable)
 * - Explicit revocation via revokedAt timestamp
 * - View tracking (viewCount, lastViewedAt)
 * - Scoped strictly to the target project (no prefix matching, no leakage)
 */
import { randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { roomObserverUrl, type ObserverLink } from "@tarima/contract";
import type * as schema from "../db/schema";
import { projects, roomShareLinks, users, type RoomShareLink } from "../db/schema";

export type ApiDb = BetterSQLite3Database<typeof schema>;

/** Default validity for a negotiation room link: 7 days in milliseconds. */
const DEFAULT_ROOM_LINK_TTL_DAYS = 7;
export const DEFAULT_ROOM_LINK_TTL_MS = DEFAULT_ROOM_LINK_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Mint a stored 192-bit random token (24 bytes -> 48 hex characters).
 * Stored and revocable, NOT a stateless signed URL.
 */
export function mintShareToken(): string {
  return randomBytes(24).toString("hex");
}

/** Check whether a link is currently valid (not revoked, not expired). */
export function isLive(
  link: { revokedAt: number | null; expiresAt: number | null },
  now = Date.now(),
): boolean {
  if (link.revokedAt !== null) return false;
  return link.expiresAt === null || link.expiresAt > now;
}

interface CreateRoomShareLinkInput {
  projectId: string;
  roomId?: string | null;
  createdBy?: string | null;
  ttlDays?: number;
}

/**
 * Create a new room share link row in the database.
 */
function createRoomShareLink(db: ApiDb, input: CreateRoomShareLinkInput): RoomShareLink {
  const id = randomUUID();
  const token = mintShareToken();
  const now = Date.now();
  const ttlDays = input.ttlDays ?? DEFAULT_ROOM_LINK_TTL_DAYS;
  const expiresAt = now + ttlDays * 24 * 60 * 60 * 1000;

  const row: RoomShareLink = {
    id,
    projectId: input.projectId,
    roomId: input.roomId ?? null,
    token,
    createdBy: input.createdBy ?? null,
    createdAt: now,
    expiresAt,
    revokedAt: null,
    viewCount: 0,
    lastViewedAt: null,
  };

  db.insert(roomShareLinks).values(row).run();

  return row;
}

/**
 * Idempotent: return the existing live share link for this project/room,
 * or mint a new one if none is currently active.
 */
export function getOrCreateRoomShareLink(
  db: ApiDb,
  projectId: string,
  createdBy?: string | null,
  options?: { roomId?: string | null; ttlDays?: number },
): RoomShareLink {
  const now = Date.now();
  const candidates = db
    .select()
    .from(roomShareLinks)
    .where(and(eq(roomShareLinks.projectId, projectId), isNull(roomShareLinks.revokedAt)))
    .orderBy(desc(roomShareLinks.createdAt))
    .all();

  const matching = options?.roomId
    ? candidates.filter((row) => row.roomId === options.roomId)
    : candidates;

  const live = matching.find((row) => isLive(row, now));
  if (live) return live;

  return createRoomShareLink(db, {
    projectId,
    roomId: options?.roomId,
    createdBy,
    ttlDays: options?.ttlDays,
  });
}

/**
 * Resolves a live (not revoked, not expired) token for the given project.
 * Returns null if the token does not exist, is expired, is revoked,
 * or was minted for a different project.
 */
export function resolveRoomShareToken(
  db: ApiDb,
  token: string,
  projectId: string,
): RoomShareLink | null {
  const [row] = db.select().from(roomShareLinks).where(eq(roomShareLinks.token, token)).all();

  if (!row) return null;
  if (!isLive(row, Date.now())) return null;
  // Strict scope check: room links grant access ONLY to their intended project.
  if (row.projectId !== projectId) return null;

  return row;
}

/**
 * Explicitly revoke all active share links for a project (and optional room).
 */
export function revokeRoomShareLink(
  db: ApiDb,
  projectId: string,
  roomId?: string | null,
): { ok: boolean; revokedAt: number } {
  const now = Date.now();
  const condition = roomId
    ? and(
        eq(roomShareLinks.projectId, projectId),
        eq(roomShareLinks.roomId, roomId),
        isNull(roomShareLinks.revokedAt),
      )
    : and(eq(roomShareLinks.projectId, projectId), isNull(roomShareLinks.revokedAt));

  db.update(roomShareLinks).set({ revokedAt: now }).where(condition).run();

  return { ok: true, revokedAt: now };
}

/**
 * Increment the view count and update lastViewedAt for a share link.
 */
export function incrementRoomViewCount(db: ApiDb, token: string): void {
  const now = Date.now();
  db.update(roomShareLinks)
    .set({
      viewCount: sql`${roomShareLinks.viewCount} + 1`,
      lastViewedAt: now,
    })
    .where(eq(roomShareLinks.token, token))
    .run();
}

/**
 * Redact an email address so observers never see raw PII.
 * Example: 'alex@example.com' -> 'a***@example.com'.
 */
export function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const [local, domain] = parts;
  const initial = local.length > 0 ? local[0] : "";
  return `${initial}***@${domain}`;
}

/**
 * Retrieve owner attribution (display name or masked email) for the observer banner.
 */
export function getRoomOwnerAttribution(
  db: ApiDb,
  projectId: string,
): { displayName: string | null } {
  const [project] = db
    .select({ ownerId: projects.ownerId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .all();

  if (!project?.ownerId) return { displayName: null };

  const [user] = db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, project.ownerId))
    .all();

  if (!user) return { displayName: null };
  const displayName = user.name?.trim() || maskEmail(user.email);
  return { displayName };
}

/**
 * Convert a DB row into the contract's ObserverLink wire shape.
 */
export function toObserverLink(row: RoomShareLink, origin = ""): ObserverLink {
  return {
    id: row.id,
    projectId: row.projectId,
    roomId: row.roomId,
    token: row.token,
    shareUrl: roomObserverUrl(origin, row.projectId, row.token),
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    viewCount: row.viewCount,
    lastViewedAt: row.lastViewedAt,
  };
}
