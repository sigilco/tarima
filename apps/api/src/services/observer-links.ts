/**
 * Observer link service: stored, revocable tokens that open a
 * read-only project view for someone outside the app (a client
 * delegate, a sponsor rep, the venue owner).
 *
 * Ported from the SP7-deleted `room-share.ts`; the negotiation room is
 * gone, so the link now resolves to the project board view at
 * `/app/o/:projectId?share_token=…` (contract `projectObserverUrl`).
 *
 * The Brioso stored-token properties are unchanged:
 * - 192-bit opaque random token (24 bytes hex), stored in
 *   `room_share_links` (the surviving table)
 * - one idempotent live link per project
 * - 7-day default expiry, remintable
 * - explicit revocation via `revokedAt`
 * - view tracking (`viewCount`, `lastViewedAt`)
 * - strict project scoping: a token minted for project A never opens B
 */
import { randomBytes, randomUUID } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { projectObserverUrl, type ObserverLink } from "@tarima/contract";
import type * as schema from "../db/schema";
import { projects, roomShareLinks, users, type RoomShareLink } from "../db/schema";

export type ApiDb = BetterSQLite3Database<typeof schema>;

/** Default validity for an observer link: 7 days in milliseconds. */
const DEFAULT_OBSERVER_LINK_TTL_DAYS = 7;
export const DEFAULT_OBSERVER_LINK_TTL_MS = DEFAULT_OBSERVER_LINK_TTL_DAYS * 24 * 60 * 60 * 1000;

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

interface CreateObserverLinkInput {
  projectId: string;
  createdBy?: string | null;
  ttlDays?: number;
}

/** Create a new observer link row in the database. */
function createObserverLink(db: ApiDb, input: CreateObserverLinkInput): RoomShareLink {
  const id = randomUUID();
  const token = mintShareToken();
  const now = Date.now();
  const ttlDays = input.ttlDays ?? DEFAULT_OBSERVER_LINK_TTL_DAYS;
  const expiresAt = now + ttlDays * 24 * 60 * 60 * 1000;

  const row: RoomShareLink = {
    id,
    projectId: input.projectId,
    // No negotiation room exists post-SP7; the column stays for the
    // dormant deal tables and is always null on new links.
    roomId: null,
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
 * Idempotent: return the existing live link for this project, or mint a
 * new one if none is currently active.
 */
export function getOrCreateObserverLink(
  db: ApiDb,
  projectId: string,
  createdBy?: string | null,
  options?: { ttlDays?: number },
): RoomShareLink {
  const now = Date.now();
  const candidates = db
    .select()
    .from(roomShareLinks)
    .where(and(eq(roomShareLinks.projectId, projectId), isNull(roomShareLinks.revokedAt)))
    .orderBy(desc(roomShareLinks.createdAt))
    .all();

  const live = candidates.find((row) => isLive(row, now));
  if (live) return live;

  return createObserverLink(db, { projectId, createdBy, ttlDays: options?.ttlDays });
}

/** The currently-live link for a project, or null. */
export function currentObserverLink(db: ApiDb, projectId: string): RoomShareLink | null {
  const now = Date.now();
  const candidates = db
    .select()
    .from(roomShareLinks)
    .where(and(eq(roomShareLinks.projectId, projectId), isNull(roomShareLinks.revokedAt)))
    .orderBy(desc(roomShareLinks.createdAt))
    .all();
  return candidates.find((row) => isLive(row, now)) ?? null;
}

/**
 * Resolve a live (not revoked, not expired) token for the given project.
 * Returns null if the token does not exist, is expired, is revoked,
 * or was minted for a different project — the caller answers a uniform
 * 401 so a valid token on the wrong project never confirms itself.
 */
export function resolveObserverLink(
  db: ApiDb,
  token: string,
  projectId: string,
): RoomShareLink | null {
  const [row] = db.select().from(roomShareLinks).where(eq(roomShareLinks.token, token)).all();

  if (!row) return null;
  if (!isLive(row, Date.now())) return null;
  // Strict scope check: observer links grant access ONLY to their
  // intended project.
  if (row.projectId !== projectId) return null;

  return row;
}

/** Explicitly revoke all active observer links for a project. */
export function revokeObserverLinks(
  db: ApiDb,
  projectId: string,
): { ok: boolean; revokedAt: number } {
  const now = Date.now();
  db.update(roomShareLinks)
    .set({ revokedAt: now })
    .where(and(eq(roomShareLinks.projectId, projectId), isNull(roomShareLinks.revokedAt)))
    .run();

  return { ok: true, revokedAt: now };
}

/** Increment the view count and update lastViewedAt for a link. */
export function incrementObserverViewCount(db: ApiDb, token: string): void {
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
 * Retrieve owner attribution (display name or masked email) for the
 * observer banner.
 */
export function getProjectOwnerAttribution(
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
 * Convert a DB row into the contract's ObserverLink wire shape. The
 * share URL points at the new read-only project view.
 */
export function toObserverLink(row: RoomShareLink, origin = ""): ObserverLink {
  return {
    id: row.id,
    projectId: row.projectId,
    roomId: row.roomId,
    token: row.token,
    shareUrl: projectObserverUrl(origin, row.projectId, row.token),
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    viewCount: row.viewCount,
    lastViewedAt: row.lastViewedAt,
  };
}
