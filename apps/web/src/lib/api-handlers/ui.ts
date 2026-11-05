/**
 * UI surface handlers (`/api/ui/*`, session-cookie authenticated).
 * Ported from apps/api/src/routes/ui.ts, unchanged logic and shapes.
 */
import { eq } from "drizzle-orm";
import * as v from "valibot";
import {
  GATE_FOR_STAGE,
  approveRequestSchema,
  channelSchema,
  chaseRowStateSchema,
  createProjectSchema,
  projectGoalSchema,
  stageRequestSchema,
  venueContactRequestSchema,
  venueSearchRequestSchema,
  type ApprovalGate,
  type CatalogVenue,
  type ProjectStage,
} from "@tarima/contract";
import { db } from "@tarima/api/db";
import { entities, venueCatalog } from "@tarima/api/db/schema";
import { createProject, getProject, listProjects } from "@tarima/api/services/projects";
import { createEntity, getEntity, listEntities } from "@tarima/api/services/entities";
import { triggerWorkflow, WORKFLOW_TEMPLATES } from "@tarima/api/services/workflows";
import { listDrafts } from "@tarima/api/services/drafts";
import { handleBulkIntake } from "@tarima/api/services/bulk-intake";
import { advanceStage, decideGate } from "@tarima/api/services/approval";
import { curateProject } from "@tarima/api/services/curation";
import { searchVenues, venueSearchDeps, type VenueRow } from "@tarima/api/services/venue-search";
import { summarizeBoard } from "@tarima/api/lib/board";
import { readJson, sessionUserId } from "./helpers";

const bulkBodySchema = v.object({ csv: v.pipe(v.string(), v.maxLength(1_000_000)) });
const workflowBodySchema = v.object({
  template: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
});

/** The caller's session user id, or the 401 response. */
function requireSessionOr401(request: Request): { userId?: string; response?: Response } {
  const userId = sessionUserId(request);
  if (!userId) return { response: Response.json({ error: "unauthorized" }, { status: 401 }) };
  return { userId };
}

/** A catalog row in the contract's wire shape (the honesty flags included). */
function toCatalogVenue(row: VenueRow): CatalogVenue {
  const contact = row.contactEmail ?? undefined;
  return {
    id: row.id,
    city: row.city,
    name: row.name,
    ...(row.area ? { area: row.area } : {}),
    ...(row.capacity !== null ? { capacity: row.capacity } : {}),
    ...(row.priceBand ? { priceBand: row.priceBand } : {}),
    source: row.source,
    ...(row.url ? { url: row.url } : {}),
    ...(row.externalId ? { externalId: row.externalId } : {}),
    ...(contact ? { contactEmail: contact } : {}),
    ...(row.contactPhone ? { contactPhone: row.contactPhone } : {}),
    ...(row.website ? { website: row.website } : {}),
    needsContact: !contact,
  };
}

/** The project payload plus the gate waiting on the user, if any. */
function projectWithGate(
  stage: string,
  project: ReturnType<typeof getProject> & {},
): Record<string, unknown> {
  const pendingGate = GATE_FOR_STAGE[stage as ProjectStage] as ApprovalGate | undefined;
  return { ...project, ...(pendingGate ? { pendingGate } : {}) };
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

  // The goal carries the brief (contract `projectGoalSchema`). A brief
  // that does not hold is a client error, not a 500.
  const goal = parsed.output.goal;
  if (goal !== undefined && !v.safeParse(projectGoalSchema, goal).success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const project = createProject(db, { ...parsed.output, ownerId: session.userId ?? null });
  return Response.json({ project }, { status: 201 });
}

/** GET /api/ui/projects/:projectId */
export function handleUiGetProject(request: Request, projectId: string): Response {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;
  const project = getProject(db, projectId, session.userId ?? null);
  if (!project) return Response.json({ error: "not_found" }, { status: 404 });
  const pendingGate = GATE_FOR_STAGE[project.stage as ProjectStage];
  return Response.json({
    project: projectWithGate(project.stage, project),
    ...(pendingGate ? { pendingGate } : {}),
  });
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

/** GET /api/ui/projects/:projectId/board */
export function handleUiBoard(request: Request, projectId: string): Response {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;
  const project = getProject(db, projectId, session.userId ?? null);
  if (!project) return Response.json({ error: "not_found" }, { status: 404 });

  const boardEntities = listEntities(db, projectId);
  const pendingGate = GATE_FOR_STAGE[project.stage as ProjectStage];
  return Response.json({
    project: projectWithGate(project.stage, project),
    // The gate is also at the root of the payload: the board reads it
    // there, next to the project and the rows.
    ...(pendingGate ? { pendingGate } : {}),
    entities: boardEntities,
    summary: summarizeBoard(boardEntities),
  });
}

/** GET /api/ui/projects/:projectId/drafts */
export function handleUiDrafts(request: Request, projectId: string): Response {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;
  const view = listDrafts(db, projectId, session.userId ?? null);
  if (!view) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({
    projectId: view.project.id,
    stage: view.project.stage,
    ...(view.pendingGate ? { pendingGate: view.pendingGate } : {}),
    drafts: view.drafts,
  });
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

/** PATCH /api/ui/projects/:projectId/entities/:entityId/contact */
export async function handleUiSetRowContact(
  request: Request,
  projectId: string,
  entityId: string,
): Promise<Response> {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;
  if (!getProject(db, projectId, session.userId ?? null)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = v.safeParse(
    v.object({ contact: v.pipe(v.string(), v.trim(), v.email()) }),
    await readJson(request),
  );
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const row = db.select().from(entities).where(eq(entities.id, entityId)).get();
  if (!row || row.projectId !== projectId) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const goal = { ...row.goal };
  const missing = Array.isArray(goal.missing)
    ? (goal.missing as unknown[]).filter((item) => item !== "contact")
    : [];
  goal.missing = missing;
  db.update(entities)
    .set({ contactEmail: parsed.output.contact, goal, updatedAt: Date.now() })
    .where(eq(entities.id, row.id))
    .run();

  return Response.json({ entity: getEntity(db, row.id) });
}

/** POST /api/ui/projects/:projectId/entities/bulk */
export async function handleUiBulkIntake(request: Request, projectId: string): Promise<Response> {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;
  if (!getProject(db, projectId, session.userId ?? null)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = v.safeParse(bulkBodySchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const actor = session.userId ?? "ui";
  const result = await handleBulkIntake(projectId, parsed.output.csv, actor);
  return Response.json(result, { status: result.fatal ? 400 : 200 });
}

/** POST /api/ui/projects/:projectId/workflows */
export async function handleUiTriggerWorkflow(
  request: Request,
  projectId: string,
): Promise<Response> {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;
  if (!getProject(db, projectId, session.userId ?? null)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const parsed = v.safeParse(workflowBodySchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const template = parsed.output.template as (typeof WORKFLOW_TEMPLATES)[number];
  if (!WORKFLOW_TEMPLATES.includes(template)) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const runs = triggerWorkflow(db, projectId, template);
  const project = getProject(db, projectId)!;
  return Response.json(
    {
      runs,
      stage: project.stage,
      ...(GATE_FOR_STAGE[project.stage as ProjectStage]
        ? { pendingGate: GATE_FOR_STAGE[project.stage as ProjectStage] }
        : {}),
    },
    { status: 201 },
  );
}

/** POST /api/ui/projects/:projectId/stage */
export async function handleUiAdvanceStage(request: Request, projectId: string): Promise<Response> {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;
  if (!getProject(db, projectId)) return Response.json({ error: "not_found" }, { status: 404 });

  const parsed = v.safeParse(stageRequestSchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const result = await advanceStage(projectId, parsed.output.to);
  if (!result.ok) return Response.json({ error: result.error.code }, { status: 409 });
  return Response.json({
    projectId,
    stage: result.value.stage,
    ...(result.value.pendingGate ? { pendingGate: result.value.pendingGate } : {}),
  });
}

/** POST /api/ui/projects/:projectId/approve */
export async function handleUiDecideGate(request: Request, projectId: string): Promise<Response> {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;
  if (!getProject(db, projectId)) return Response.json({ error: "not_found" }, { status: 404 });

  const parsed = v.safeParse(approveRequestSchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const { gate, decision, brief, entityIds } = parsed.output;
  const result = await decideGate(projectId, gate, decision, { brief, entityIds });
  if (!result.ok) {
    const status = result.error.code === "not_found" ? 404 : 409;
    return Response.json({ error: result.error.code }, { status });
  }
  return Response.json({
    projectId,
    stage: result.value.stage,
    ...(result.value.pendingGate ? { pendingGate: result.value.pendingGate } : {}),
    released: result.value.released,
    discarded: result.value.discarded,
  });
}

/** POST /api/ui/projects/:projectId/curate */
export async function handleUiCurate(request: Request, projectId: string): Promise<Response> {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;
  if (!getProject(db, projectId)) return Response.json({ error: "not_found" }, { status: 404 });

  try {
    const { candidates, noContact } = await curateProject(projectId);
    const project = getProject(db, projectId)!;
    return Response.json({ projectId, candidates, noContact, stage: project.stage });
  } catch (err) {
    const message = err instanceof Error ? err.message : "curation failed";
    if (message.includes("no confirmed brief")) {
      return Response.json({ error: "no_brief" }, { status: 409 });
    }
    return Response.json({ error: "curation_failed" }, { status: 500 });
  }
}

/** POST /api/ui/venues/search */
export async function handleUiVenueSearch(request: Request): Promise<Response> {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;

  const parsed = v.safeParse(venueSearchRequestSchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const { city, category, limit } = parsed.output;
  const deps = venueSearchDeps();
  if (!deps) return Response.json({ error: "no_provider" }, { status: 503 });
  const result = await searchVenues(
    db,
    { city, category: category ?? "bar", ...(limit ? { limit } : {}) },
    deps,
  );
  return Response.json({
    city: result.rows[0]?.city ?? city,
    category: category ?? "",
    cache: result.cache,
    refreshing: result.refreshing,
    venues: result.rows.map(toCatalogVenue),
  });
}

/** PATCH /api/ui/venues/:venueId/contact */
export async function handleUiVenueContact(request: Request, venueId: string): Promise<Response> {
  const session = requireSessionOr401(request);
  if (session.response) return session.response;

  const parsed = v.safeParse(venueContactRequestSchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const row = db.select().from(venueCatalog).where(eq(venueCatalog.id, venueId)).get();
  if (!row) return Response.json({ error: "not_found" }, { status: 404 });

  const patch = parsed.output;
  db.update(venueCatalog)
    .set({
      contactEmail: patch.contactEmail ?? row.contactEmail,
      contactPhone: patch.contactPhone ?? row.contactPhone,
      website: patch.website ?? row.website,
    })
    .where(eq(venueCatalog.id, row.id))
    .run();

  const updated = db.select().from(venueCatalog).where(eq(venueCatalog.id, row.id)).get()!;
  return Response.json({ venue: toCatalogVenue(updated) });
}
