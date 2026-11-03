/**
 * Negotiation room routes (Observer link & Access layer).
 *
 * Endpoints:
 *   POST   /api/ui/projects/:projectId/room-link   (owner-only, mints/gets live link)
 *   DELETE /api/ui/projects/:projectId/room-link   (owner-only, revokes active link)
 *   GET    /api/ui/projects/:projectId/room        (owner or observer via ?share_token=)
 *
 * Security:
 * - Handled by `requireRoomAccess` middleware.
 * - Observers cannot write (mutations strictly owner-only).
 * - Read payload narrows/redacts PII for observers.
 */
import { Hono } from "hono";
import * as v from "valibot";
import { mintRoomLinkRequestSchema, roomObserverUrl } from "@tarima/contract";
import { db } from "../db";
import { getProject } from "../services/projects";
import { listEntities } from "../services/entities";
import {
  getOrCreateRoomShareLink,
  getRoomOwnerAttribution,
  revokeRoomShareLink,
  toObserverLink,
} from "../services/room-share";
import {
  getRoomActor,
  requireRoomAccess,
  type RoomAccessEnv,
} from "../middleware/require-room-access";
import { getSessionUser } from "../middleware/require-session";

function originFromRequest(req: Request): string {
  try {
    return new URL(req.url).origin;
  } catch {
    return "";
  }
}

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
  );
