/**
 * Projects + entities + csv intake + workflows bearer handlers.
 * Ported from apps/api/src/routes/{projects,entities,csv,workflows}.ts.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { GATE_FOR_STAGE, type ProjectStage } from "@tarima/contract";
import {
  approveRequestSchema,
  createEntitySchema,
  createProjectSchema,
  projectGoalSchema,
  stageRequestSchema,
  updateEntitySchema,
} from "@tarima/contract";
import { audit } from "@tarima/obs";
import { db } from "@tarima/api/db";
import { entities, events, projects, type EntityStatus } from "@tarima/api/db/schema";
import { createEntity, getEntity, listEntities, updateEntity } from "@tarima/api/services/entities";
import { advanceStage, decideGate } from "@tarima/api/services/approval";
import { curateProject } from "@tarima/api/services/curation";
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
} from "@tarima/api/services/projects";
import { parseEntitiesCsvDetailed } from "@tarima/api/services/csv-intake";
import {
  getWorkflowView,
  triggerWorkflow,
  WORKFLOW_TEMPLATES,
} from "@tarima/api/services/workflows";
import { pushDigest } from "@tarima/api/telegram";
import { readJson, requireApiKey } from "./helpers";

const patchSchema = v.omit(updateEntitySchema, ["updatedAt"]);

/** GET /api/projects — list all (bearer). */
export function handleListProjects(request: Request): Response {
  const guard = requireApiKey(request, ["projects:read"]);
  if (!guard.ok) return guard.response;
  return Response.json({ projects: listProjects(db) });
}

/** POST /api/projects — create (bearer). */
export async function handleCreateProject(request: Request): Promise<Response> {
  const guard = requireApiKey(request, ["projects:write"]);
  if (!guard.ok) return guard.response;

  const parsed = v.safeParse(createProjectSchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  // The goal carries the brief (contract `projectGoalSchema`). The same
  // check runs on the browser surface, so both surfaces agree.
  const goal = parsed.output.goal;
  if (goal !== undefined && !v.safeParse(projectGoalSchema, goal).success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const project = createProject(db, parsed.output);
  return Response.json({ project }, { status: 201 });
}

/** GET /api/projects/:projectId (bearer). */
export function handleGetProject(request: Request, projectId: string): Response {
  const guard = requireApiKey(request, ["projects:read"]);
  if (!guard.ok) return guard.response;
  const project = getProject(db, projectId);
  if (!project) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ project });
}

/** PATCH /api/projects/:projectId (bearer). */
export async function handlePatchProject(request: Request, projectId: string): Promise<Response> {
  const guard = requireApiKey(request, ["projects:write"]);
  if (!guard.ok) return guard.response;

  const parsed = v.safeParse(v.partial(createProjectSchema), await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const project = updateProject(db, projectId, parsed.output);
  if (!project) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ project });
}

/** GET /api/projects/:projectId/entities (bearer). */
export function handleListProjectEntities(request: Request, projectId: string): Response {
  const guard = requireApiKey(request, ["entities:read"]);
  if (!guard.ok) return guard.response;
  if (!getProject(db, projectId)) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ entities: listEntities(db, projectId) });
}

/** POST /api/projects/:projectId/entities (bearer). */
export async function handleCreateEntity(request: Request, projectId: string): Promise<Response> {
  const guard = requireApiKey(request, ["entities:write"]);
  if (!guard.ok) return guard.response;
  if (!getProject(db, projectId)) return Response.json({ error: "not_found" }, { status: 404 });

  // The path owns the project id; the body must not carry a second one.
  const parsed = v.safeParse(v.omit(createEntitySchema, ["projectId"]), await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const entity = createEntity(db, { ...parsed.output, projectId });
  return Response.json({ entity }, { status: 201 });
}

/** POST /api/projects/:projectId/stage (bearer). */
export async function handleAdvanceStage(request: Request, projectId: string): Promise<Response> {
  const guard = requireApiKey(request, ["projects:write"]);
  if (!guard.ok) return guard.response;
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

/** POST /api/projects/:projectId/approve (bearer). */
export async function handleDecideGate(request: Request, projectId: string): Promise<Response> {
  const guard = requireApiKey(request, ["projects:write"]);
  if (!guard.ok) return guard.response;
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

/** POST /api/projects/:projectId/curate (bearer). */
export async function handleCurate(request: Request, projectId: string): Promise<Response> {
  const guard = requireApiKey(request, ["projects:write"]);
  if (!guard.ok) return guard.response;
  if (!getProject(db, projectId)) return Response.json({ error: "not_found" }, { status: 404 });

  try {
    const { candidates, noContact } = await curateProject(projectId);
    return Response.json({
      projectId,
      candidates,
      noContact,
      stage: getProject(db, projectId)!.stage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "curation failed";
    if (message.includes("no confirmed brief")) {
      return Response.json({ error: "no_brief" }, { status: 409 });
    }
    return Response.json({ error: "curation_failed" }, { status: 500 });
  }
}

/** GET /api/entities/:entityId (bearer). */
export function handleGetEntity(request: Request, entityId: string): Response {
  const guard = requireApiKey(request, ["entities:read"]);
  if (!guard.ok) return guard.response;
  const entity = getEntity(db, entityId);
  if (!entity) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ entity });
}

/** PATCH /api/entities/:entityId (bearer). */
export async function handlePatchEntity(request: Request, entityId: string): Promise<Response> {
  const guard = requireApiKey(request, ["entities:write"]);
  if (!guard.ok) return guard.response;

  const parsed = v.safeParse(patchSchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const entity = updateEntity(db, entityId, parsed.output);
  if (!entity) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ entity });
}

/** POST /api/projects/:projectId/workflows (bearer). */
export async function handleTriggerWorkflow(
  request: Request,
  projectId: string,
): Promise<Response> {
  const guard = requireApiKey(request, ["workflows:write"]);
  if (!guard.ok) return guard.response;
  if (!getProject(db, projectId)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const triggerSchema = v.object({
    template: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  });
  const parsed = v.safeParse(triggerSchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const template = parsed.output.template as (typeof WORKFLOW_TEMPLATES)[number];
  if (!WORKFLOW_TEMPLATES.includes(template)) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const runs = triggerWorkflow(db, projectId, template);
  const project = getProject(db, projectId)!;
  const pendingGate = GATE_FOR_STAGE[project.stage as ProjectStage];
  return Response.json(
    {
      runs,
      stage: project.stage,
      ...(pendingGate ? { pendingGate } : {}),
    },
    { status: 201 },
  );
}

/** GET /api/workflows/:runId (bearer). */
export function handleGetWorkflow(request: Request, runId: string): Response {
  const guard = requireApiKey(request, ["workflows:read"]);
  if (!guard.ok) return guard.response;
  const view = getWorkflowView(db, runId);
  if (!view) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(view);
}

/** The status intake rows land in, in the db vocabulary. */
const INTAKE_STATUS: EntityStatus = "intake";

const csvBodySchema = v.object({ csv: v.pipe(v.string(), v.maxLength(1_000_000)) });

/** The wire shape of one created entity (contract `entitySchema`). */
interface EntityWire {
  id: string;
  projectId: string;
  name: string;
  contact?: string;
  status: string;
  missing: string[];
  createdAt: string;
  updatedAt: string;
}

/** A freshly inserted row, mapped to the wire vocabulary. */
function toWire(row: typeof entities.$inferSelect): EntityWire {
  const goal = (row.goal ?? {}) as { missing?: unknown };
  const missing = Array.isArray(goal.missing)
    ? goal.missing.filter((item): item is string => typeof item === "string")
    : [];
  const contact = row.contactEmail ?? undefined;
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    ...(contact ? { contact } : {}),
    // `intake` is spelled the same in the db and on the wire, so no
    // translation is needed on this path.
    status: row.status,
    missing,
    createdAt: new Date(row.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(row.updatedAt ?? Date.now()).toISOString(),
  };
}

/** POST /api/projects/:projectId/entities/bulk (bearer). */
export async function handleBulkIntakeCsv(request: Request, projectId: string): Promise<Response> {
  const guard = requireApiKey(request, ["entities:write"]);
  if (!guard.ok) return guard.response;

  const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!project) return Response.json({ error: "not_found" }, { status: 404 });

  const parsedBody = v.safeParse(csvBodySchema, await readJson(request));
  if (!parsedBody.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const { entities: rows, errors, fatal } = parseEntitiesCsvDetailed(parsedBody.output.csv);
  // A document that cannot be read as a CSV of entities at all is a
  // client error; a document with a few bad rows is not.
  if (fatal) return Response.json({ created: 0, entities: [], errors }, { status: 400 });

  // Stamp each row with its own millisecond so the board keeps the csv
  // order: the rows are sorted by (createdAt, id) and a single shared
  // timestamp would leave the order to the random uuid.
  const now = Date.now();
  const created = rows.map((row, index) => {
    const stamp = now + index;
    const record: typeof entities.$inferSelect = {
      id: randomUUID(),
      projectId,
      name: row.name,
      contactEmail: row.contact ?? null,
      goal: { missing: row.missing },
      result: {},
      status: INTAKE_STATUS,
      createdAt: stamp,
      updatedAt: stamp,
    };
    db.insert(entities).values(record).run();
    return toWire(record);
  });

  db.insert(events)
    .values({
      id: randomUUID(),
      actor: "api",
      type: "entities.bulk_intake",
      subjectType: "project",
      subjectId: projectId,
      data: { created: created.length, failed: errors.length },
    })
    .run();

  audit("entities.bulk_intake", {
    userId: "api",
    target: `project:${projectId}`,
    extra: { created: created.length, failed: errors.length },
  });

  // The board changed, so the chats bound to this project get the new
  // digest. A push failure must not fail the intake.
  if (created.length > 0) {
    pushDigest(projectId).catch((err) => console.error("[telegram] digest push failed", err));
  }

  return Response.json({ created: created.length, entities: created, errors });
}
