/**
 * UI surface handlers (`/api/ui/*`, session-cookie authenticated).
 * SP7 teardown: only what the new workspace shell and the proof
 * harnesses still call — list/create projects, list/create entities.
 * The board, drafts, stage, approve, curate, venue search and workflow
 * triggers went away with the legacy UI.
 */
import * as v from "valibot";
import { channelSchema, chaseRowStateSchema, createProjectSchema } from "@tarima/contract";
import { db } from "@tarima/api/db";
import { createProject, getProject, listProjects } from "@tarima/api/services/projects";
import { createEntity, listEntities } from "@tarima/api/services/entities";
import { readJson, sessionUserId } from "./helpers";

/** The caller's session user id, or the 401 response. */
function requireSessionOr401(request: Request): { userId?: string; response?: Response } {
  const userId = sessionUserId(request);
  if (!userId) return { response: Response.json({ error: "unauthorized" }, { status: 401 }) };
  return { userId };
}

/** GET /api/ui/projects */
export function handleUiListProjects(request: Request): Response {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;
  return Response.json({ projects: listProjects(db, session.userId ?? null) });
}

/** POST /api/ui/projects */
export async function handleUiCreateProject(request: Request): Promise<Response> {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;

  const parsed = v.safeParse(createProjectSchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const project = createProject(db, { ...parsed.output, ownerId: session.userId ?? null });
  return Response.json({ project }, { status: 201 });
}

/** GET /api/ui/projects/:projectId */
export function handleUiGetProject(request: Request, projectId: string): Response {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;
  const project = getProject(db, projectId, session.userId ?? null);
  if (!project) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ project });
}

/** GET /api/ui/projects/:projectId/entities */
export function handleUiListEntities(request: Request, projectId: string): Response {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;
  if (!getProject(db, projectId, session.userId ?? null)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json({ entities: listEntities(db, projectId) });
}

const addRowBodySchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)),
  contact: v.optional(v.pipe(v.string(), v.trim(), v.email())),
  channel: v.optional(channelSchema),
  missing: v.optional(v.array(v.pipe(v.string(), v.trim(), v.maxLength(200)))),
  status: v.optional(chaseRowStateSchema),
});

/** POST /api/ui/projects/:projectId/entities */
export async function handleUiCreateEntity(request: Request, projectId: string): Promise<Response> {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;
  if (!getProject(db, projectId, session.userId ?? null)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = v.safeParse(addRowBodySchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const entity = createEntity(db, {
    projectId,
    name: parsed.output.name,
    ...(parsed.output.contact ? { contact: parsed.output.contact } : {}),
    ...(parsed.output.channel ? { channel: parsed.output.channel } : {}),
    missing: parsed.output.missing ?? [],
    status: parsed.output.status ?? "intake",
  });
  return Response.json({ entity }, { status: 201 });
}
