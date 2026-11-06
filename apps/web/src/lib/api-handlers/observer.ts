/**
 * Observer link handlers.
 *
 * Owner surface (`/api/ui/projects/:projectId/observer-link`, session
 * cookie): read the live link, mint one idempotently, revoke all live
 * links. Project ownership is enforced like every other /api/ui route:
 * another user's project reads as 404.
 *
 * Public surface (`/api/observer/:projectId?share_token=…`): resolves a
 * live token to a read-only project view. No session — the token IS the
 * credential. Invalid, expired, revoked and wrong-project tokens all
 * answer the same 401 (anti-probing, see .agents/docs/observer-link.md).
 */
import * as v from "valibot";
import { mintRoomLinkRequestSchema, shareTokenSchema } from "@tarima/contract";
import { db } from "@tarima/api/db";
import { getProject } from "@tarima/api/services/projects";
import { listEntities as listProjectEntities } from "@tarima/api/services/entities";
import {
  currentObserverLink,
  getOrCreateObserverLink,
  getProjectOwnerAttribution,
  incrementObserverViewCount,
  resolveObserverLink,
  revokeObserverLinks,
  toObserverLink,
} from "@tarima/api/services/observer-links";
import { readJson, sessionUserId } from "./helpers";

function originOf(request: Request): string {
  return new URL(request.url).origin;
}

/** GET /api/ui/projects/:projectId/observer-link — the live link, or null. */
export function handleUiGetObserverLink(request: Request, projectId: string): Response {
  const userId = sessionUserId(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!getProject(db, projectId, userId)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  const row = currentObserverLink(db, projectId);
  return Response.json({ link: row ? toObserverLink(row, originOf(request)) : null });
}

/** POST /api/ui/projects/:projectId/observer-link — idempotent mint. */
export async function handleUiCreateObserverLink(
  request: Request,
  projectId: string,
): Promise<Response> {
  const userId = sessionUserId(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!getProject(db, projectId, userId)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const body = await readJson(request);
  const parsed = v.safeParse(mintRoomLinkRequestSchema, body ?? {});
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const row = getOrCreateObserverLink(db, projectId, userId, {
    ttlDays: parsed.output.ttlDays,
  });
  return Response.json({ link: toObserverLink(row, originOf(request)) }, { status: 201 });
}

/** DELETE /api/ui/projects/:projectId/observer-link — revoke all live links. */
export function handleUiRevokeObserverLink(request: Request, projectId: string): Response {
  const userId = sessionUserId(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!getProject(db, projectId, userId)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json(revokeObserverLinks(db, projectId));
}

/**
 * GET /api/observer/:projectId?share_token=… — the public read-only view.
 * The token resolves against the path's projectId; everything that does
 * not resolve live answers the same 401.
 */
export function handleObserverView(request: Request, projectId: string): Response {
  const token = new URL(request.url).searchParams.get("share_token") ?? "";
  const tokenOk = v.is(shareTokenSchema, token);
  const link = tokenOk ? resolveObserverLink(db, token, projectId) : null;
  if (!link) return Response.json({ error: "unauthorized" }, { status: 401 });

  const project = getProject(db, projectId);
  if (!project) return Response.json({ error: "unauthorized" }, { status: 401 });

  incrementObserverViewCount(db, token);
  const { displayName } = getProjectOwnerAttribution(db, projectId);

  return Response.json({
    project: {
      id: project.id,
      name: project.name,
      stage: project.stage,
      goal: project.goal,
    },
    entities: listProjectEntities(db, projectId),
    access: {
      role: "observer",
      readOnly: true,
      expiresAt: link.expiresAt,
      ...(displayName ? { sharedByName: displayName } : {}),
    },
  });
}
