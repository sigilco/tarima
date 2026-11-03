/**
 * Room access gate middleware: classifies callers into Actor kinds
 * (session owner | share-token observer | anonymous) and enforces
 * strict scope boundaries.
 *
 * Security properties ported from Brioso:
 * - Stored opaque token: verified against room_share_links (not revoked, not expired).
 * - Exact resource scope: the token must match the path's projectId.
 *   Never prefix matching.
 * - Mutating endpoints: write mode strictly forbids observers (owner-only).
 * - Anti-probing: an invalid token, expired token, or token for a different
 *   project returns 401 "unauthorized", NEVER 403 or 404.
 *   An authenticated session caller who does not own the project returns 404
 *   (does not reveal project existence).
 * - Audit logging: sha256 prefix (12 hex chars) is recorded, NEVER the raw token.
 */
import { createHash } from "node:crypto";
import type { Context, MiddlewareHandler } from "hono";
import { db } from "../db";
import { resolveSessionUserId } from "../services/session";
import { getProject } from "../services/projects";
import { incrementRoomViewCount, resolveRoomShareToken } from "../services/room-share";

export type RoomActor =
  | { kind: "session"; userId: string; role: "owner" }
  | {
      kind: "share-token";
      token: string;
      projectId: string;
      roomId: string | null;
      role: "observer";
    }
  | { kind: "anonymous" };

interface SessionState {
  userId: string;
}

const ROOM_ACTOR_VAR = "roomActor";
const SESSION_USER_VAR = "sessionUser";

export interface RoomAccessEnv {
  Variables: {
    [ROOM_ACTOR_VAR]: RoomActor;
    [SESSION_USER_VAR]?: SessionState;
  };
}

export interface RoomAccessOptions {
  /** 'read' allows observer tokens; 'write' requires owner session. Default: 'read'. */
  mode?: "read" | "write";
  /** Whether share-token is accepted on read routes. Default: true. */
  allowObserver?: boolean;
}

/**
 * Derives an audit-safe actor descriptor.
 * Never stores or logs raw share tokens (hashes first 12 hex chars of sha256).
 */
export function auditActorFields(actor: RoomActor): {
  actorKind: RoomActor["kind"];
  actorId: string | null;
} {
  switch (actor.kind) {
    case "session":
      return { actorKind: "session", actorId: actor.userId };
    case "share-token": {
      const hash = createHash("sha256").update(actor.token).digest("hex").slice(0, 12);
      return { actorKind: "share-token", actorId: `sha256:${hash}` };
    }
    case "anonymous":
      return { actorKind: "anonymous", actorId: null };
  }
}

/**
 * Middleware factory for room access.
 */
export function requireRoomAccess(
  options: RoomAccessOptions = {},
): MiddlewareHandler<RoomAccessEnv> {
  const mode = options.mode ?? "read";
  const allowObserver = options.allowObserver ?? true;

  return async (c, next) => {
    const projectId = c.req.param("projectId");
    if (!projectId) {
      return c.json({ error: "invalid_request" }, 400);
    }

    const sessionUserId = resolveSessionUserId(c.req.raw);
    const queryToken = c.req.query("share_token");
    const headerToken = c.req.header("x-share-token");
    const candidateToken = queryToken ?? headerToken ?? undefined;

    // Mutating actions: strictly owner-only.
    if (mode === "write") {
      if (!sessionUserId) {
        return c.json({ error: "unauthorized" }, 401);
      }
      const project = getProject(db, projectId, sessionUserId);
      if (!project) {
        // Anti-probing: authenticated non-owner receives 404, never 403.
        return c.json({ error: "not_found" }, 404);
      }
      c.set(SESSION_USER_VAR, { userId: sessionUserId });
      c.set(ROOM_ACTOR_VAR, { kind: "session", userId: sessionUserId, role: "owner" });
      await next();
      return;
    }

    // Read actions: check session owner first.
    if (sessionUserId) {
      const project = getProject(db, projectId, sessionUserId);
      if (project) {
        c.set(SESSION_USER_VAR, { userId: sessionUserId });
        c.set(ROOM_ACTOR_VAR, { kind: "session", userId: sessionUserId, role: "owner" });
        await next();
        return;
      }
      // If signed in but not the owner, and no share token provided, return 404.
      if (!candidateToken) {
        return c.json({ error: "not_found" }, 404);
      }
    }

    // Observer token check for read actions.
    if (allowObserver && candidateToken) {
      const link = resolveRoomShareToken(db, candidateToken, projectId);
      if (link) {
        incrementRoomViewCount(db, candidateToken);
        c.set(ROOM_ACTOR_VAR, {
          kind: "share-token",
          token: candidateToken,
          projectId,
          roomId: link.roomId,
          role: "observer",
        });
        await next();
        return;
      }
      // Anti-probing: an invalid/expired/wrong-scope token returns 401, never 403 or 404.
      return c.json({ error: "unauthorized" }, 401);
    }

    return c.json({ error: "unauthorized" }, 401);
  };
}

/** Retrieve the resolved room actor from Hono context. */
export function getRoomActor(c: Context): RoomActor | undefined {
  return c.get(ROOM_ACTOR_VAR) as RoomActor | undefined;
}
