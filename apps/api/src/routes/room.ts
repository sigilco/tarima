/**
 * Negotiation room routes (Observer link, WebSocket server & Access layer).
 *
 * Endpoints:
 *   POST   /api/ui/projects/:projectId/room-link           (owner-only, mints/gets live link)
 *   DELETE /api/ui/projects/:projectId/room-link           (owner-only, revokes active link)
 *   GET    /api/ui/projects/:projectId/room                (owner or observer via ?share_token=)
 *   GET    /api/ui/projects/:projectId/room/ws             (owner or observer WebSocket connection)
 *   POST   /api/ui/projects/:projectId/negotiations/:nid/send (owner-only HITL counter send)
 *
 * Security:
 * - Handled by `requireRoomAccess` middleware and matching WebSocket auth checks.
 * - Observers cannot write (mutations strictly owner-only).
 * - Read payload narrows/redacts PII for observers.
 */
import { Hono } from "hono";
import * as v from "valibot";
import { upgradeWebSocket } from "@hono/node-server";
import { mintRoomLinkRequestSchema, roomObserverUrl, type RoomRole } from "@tarima/contract";
import { db } from "../db";
import { getProject } from "../services/projects";
import { listEntities } from "../services/entities";
import {
  getOrCreateRoomShareLink,
  getRoomOwnerAttribution,
  incrementRoomViewCount,
  resolveRoomShareToken,
  revokeRoomShareLink,
  toObserverLink,
} from "../services/room-share";
import {
  getRoomActor,
  requireRoomAccess,
  type RoomAccessEnv,
} from "../middleware/require-room-access";
import { getSessionUser } from "../middleware/require-session";
import { resolveSessionUserId } from "../services/session";
import { handleRoomConnection, sendProposalCounter, type ConnectedSocket } from "../room";

function originFromRequest(req: Request): string {
  try {
    return new URL(req.url).origin;
  } catch {
    return "";
  }
}

// Track active socket handlers for upgradeWebSocket callbacks
const activeSocketHandlers = new WeakMap<
  object,
  { onMessage: (raw: string) => void; onClose: () => void }
>();

export const roomRoutes = new Hono<RoomAccessEnv>()
  // Mint or retrieve existing live observer link (owner only)
  .post(
    "/api/ui/projects/:projectId/room-link",
    requireRoomAccess({ mode: "write" }),
    async (c) => {
      const projectId = c.req.param("projectId");
      const sessionUser = getSessionUser(c);
      const rawBody = await c.req.json().catch(() => ({}));
      const parsed = v.safeParse(mintRoomLinkRequestSchema, rawBody);
      const body = parsed.success ? parsed.output : {};

      const link = getOrCreateRoomShareLink(db, projectId, sessionUser?.userId ?? null, {
        roomId: body.roomId,
        ttlDays: body.ttlDays,
      });

      const origin = originFromRequest(c.req.raw);
      const shareUrl = roomObserverUrl(origin, projectId, link.token);

      return c.json(
        {
          link: toObserverLink(link, origin),
          shareUrl,
        },
        201,
      );
    },
  )
  // Revoke active share links for the project (owner only)
  .delete("/api/ui/projects/:projectId/room-link", requireRoomAccess({ mode: "write" }), (c) => {
    const projectId = c.req.param("projectId");
    const result = revokeRoomShareLink(db, projectId);
    return c.json({ ok: true, revokedAt: result.revokedAt }, 200);
  })
  // Read room payload (owner or observer with share_token)
  .get(
    "/api/ui/projects/:projectId/room",
    requireRoomAccess({ mode: "read", allowObserver: true }),
    (c) => {
      const projectId = c.req.param("projectId");
      const actor = getRoomActor(c);
      if (!actor) return c.json({ error: "unauthorized" }, 401);

      const project = getProject(db, projectId);
      if (!project) return c.json({ error: "not_found" }, 404);

      const entities = listEntities(db, projectId);
      const repliedEntity = entities.find((e) => e.status === "replied" || e.status === "chasing");

      const isObserver = actor.kind === "share-token";
      const ownerAttr = isObserver ? getRoomOwnerAttribution(db, projectId) : { displayName: null };

      return c.json({
        project: {
          id: project.id,
          name: project.name,
          description: null,
          stage: project.stage,
          goal: project.goal ?? {},
        },
        room: {
          id: actor.kind === "share-token" ? (actor.roomId ?? "default") : "default",
          name: "Negotiation Room",
          status: project.stage,
          terms: {
            venueName: repliedEntity?.name ?? null,
            brief: (project.goal?.brief as Record<string, unknown> | undefined) ?? null,
            status: project.stage,
          },
        },
        access: {
          role: isObserver ? ("observer" as const) : ("owner" as const),
          readOnly: isObserver,
          expiresAt: null,
          sharedByName: isObserver ? ownerAttr.displayName : null,
        },
      });
    },
  )
  // WebSocket room connection endpoint
  .get("/api/ui/projects/:projectId/room/ws", async (c, next) => {
    const projectId = c.req.param("projectId");
    if (!projectId) return c.text("invalid_request", 400);

    const sessionUserId = resolveSessionUserId(c.req.raw);
    const queryToken = c.req.query("share_token");
    const headerToken = c.req.header("x-share-token");
    const candidateToken = queryToken ?? headerToken ?? undefined;

    let role: RoomRole = "organizer";
    let isObserver = false;
    let authorized = false;

    // Check session owner
    if (sessionUserId) {
      const project = getProject(db, projectId, sessionUserId);
      if (project) {
        role = "organizer";
        isObserver = false;
        authorized = true;
      } else if (!candidateToken) {
        // Anti-probing: authenticated non-owner receives 404
        return c.text("not_found", 404);
      }
    }

    // Check share token observer
    if (!authorized && candidateToken) {
      const link = resolveRoomShareToken(db, candidateToken, projectId);
      if (link) {
        incrementRoomViewCount(db, candidateToken);
        role = "observer";
        isObserver = true;
        authorized = true;
      } else {
        // Anti-probing: invalid token returns 401
        return c.text("unauthorized", 401);
      }
    }

    if (!authorized) {
      return c.text("unauthorized", 401);
    }

    // Handshake upgrade to WebSocket
    const upgrade = upgradeWebSocket(() => ({
      onOpen(_event, ws) {
        const socketClient: ConnectedSocket = {
          role,
          isObserver,
          send: (data: string) => ws.send(data),
          close: (code?: number, reason?: string) => ws.close(code, reason),
        };
        const handler = handleRoomConnection(projectId, socketClient);
        activeSocketHandlers.set(ws, handler);
      },
      onMessage(event, ws) {
        const handler = activeSocketHandlers.get(ws);
        if (handler && typeof event.data === "string") {
          handler.onMessage(event.data);
        }
      },
      onClose(_event, ws) {
        const handler = activeSocketHandlers.get(ws);
        if (handler) {
          handler.onClose();
          activeSocketHandlers.delete(ws);
        }
      },
      onError(_event, ws) {
        const handler = activeSocketHandlers.get(ws);
        if (handler) {
          handler.onClose();
          activeSocketHandlers.delete(ws);
        }
      },
    }));

    return upgrade(c, next);
  })
  // Explicit HITL gate: send counter proposal to vendor (owner-only REST endpoint)
  .post(
    "/api/ui/projects/:projectId/negotiations/:nid/send",
    requireRoomAccess({ mode: "write" }),
    (c) => {
      const projectId = c.req.param("projectId");
      const nid = c.req.param("nid");
      const actor = getRoomActor(c);
      if (!actor) return c.json({ error: "unauthorized" }, 401);

      const result = sendProposalCounter(projectId, nid, actor);
      if (!result.ok) {
        return c.json({ error: result.error }, result.status as 400 | 401 | 404 | 409);
      }

      return c.json({ ok: true, negotiation: result.negotiation }, 200);
    },
  );
