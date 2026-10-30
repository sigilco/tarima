/**
 * UI routes (Stage 5, T5.2): the board app's browser surface, mounted under
 * `/api/ui/*` and authenticated with the session cookie (see
 * `middleware/require-session.ts` for why this is separate from the Bearer
 * surface).
 *
 * Endpoints (same service functions, same wire shapes, as the Bearer routes):
 *   GET  /api/ui/projects                     -> { projects }
 *   POST /api/ui/projects                     -> { project }                 201
 *   GET  /api/ui/projects/:projectId          -> { project } | 404
 *   GET  /api/ui/projects/:projectId/entities -> { entities } | 404
 *   GET  /api/ui/projects/:projectId/board    -> { project, entities, summary }
 *   POST /api/ui/projects/:projectId/entities -> { entity }                 201
 *   POST /api/ui/projects/:projectId/entities/bulk   { csv } -> { created, entities, errors }
 *   POST /api/ui/projects/:projectId/workflows { template } -> { runs }      201
 *
 * The board endpoint is the one the web loader reads: it returns the
 * project, its rows and the status counts in a single round trip, so the
 * board renders from one payload.
 *
 * Writes are validated with the contract valibot schemas, exactly like the
 * Bearer surface, so both surfaces cannot drift.
 *
 * OWNERSHIP: every project route is scoped to the session user. A project
 * of another owner reads as unknown (404), never as forbidden, so the
 * board of another tester is not discoverable.
 *
 * SSE lives in `routes/events.ts` (also session-authenticated).
 */
import { Hono } from "hono";
import * as v from "valibot";
import {
  approveRequestSchema,
  channelSchema,
  chaseRowStateSchema,
  createProjectSchema,
  projectGoalSchema,
  stageRequestSchema,
} from "@tarima/contract";
import { db } from "../db";
import { requireSession, getSessionUser } from "../middleware/require-session";
import { createProject, getProject, listProjects } from "../services/projects";
import { createEntity, listEntities } from "../services/entities";
import { triggerWorkflow, WORKFLOW_TEMPLATES } from "../services/workflows";
import { handleBulkIntake } from "../services/bulk-intake";
import { advanceStage, decideGate } from "../services/approval";
import { curateProject } from "../services/curation";
import { summarizeBoard } from "../lib/board";

const bulkBodySchema = v.object({ csv: v.pipe(v.string(), v.maxLength(1_000_000)) });
const workflowBodySchema = v.object({
  template: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
});

/**
 * The body of a manual row.
 *
 * Same shape as the contract's `createEntitySchema` minus the fields the
 * server owns (`projectId`), with two conveniences for the human form:
 * `status` defaults to `intake` and `missing` defaults to an empty list,
 * so the form only asks what the organizer actually knows.
 */
const addRowBodySchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)),
  contact: v.optional(v.pipe(v.string(), v.trim(), v.email())),
  channel: v.optional(channelSchema),
  missing: v.optional(v.array(v.pipe(v.string(), v.trim(), v.maxLength(200)))),
  status: v.optional(chaseRowStateSchema),
});

export const uiRoutes = new Hono()
  .use("/api/ui/*", requireSession())
  .get("/api/ui/projects", (c) => {
    const ownerId = getSessionUser(c)?.userId ?? null;
    return c.json({ projects: listProjects(db, ownerId) });
  })
  .post("/api/ui/projects", async (c) => {
    const parsed = v.safeParse(createProjectSchema, await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    // The goal carries the brief (contract `projectGoalSchema`). A brief
    // that does not hold is a client error, not a 500.
    const goal = parsed.output.goal;
    if (goal !== undefined && !v.safeParse(projectGoalSchema, goal).success) {
      return c.json({ error: "invalid_request" }, 400);
    }

    const user = getSessionUser(c);
    const project = createProject(db, { ...parsed.output, ownerId: user?.userId ?? null });
    return c.json({ project }, 201);
  })
  .get("/api/ui/projects/:projectId", (c) => {
    const project = getProject(db, c.req.param("projectId"), getSessionUser(c)?.userId ?? null);
    if (!project) return c.json({ error: "not_found" }, 404);
    return c.json({ project });
  })
  .get("/api/ui/projects/:projectId/entities", (c) => {
    const projectId = c.req.param("projectId");
    if (!getProject(db, projectId, getSessionUser(c)?.userId ?? null)) {
      return c.json({ error: "not_found" }, 404);
    }
    const entities = listEntities(db, projectId);
    return c.json({ entities });
  })
  .get("/api/ui/projects/:projectId/board", (c) => {
    const projectId = c.req.param("projectId");
    const project = getProject(db, projectId, getSessionUser(c)?.userId ?? null);
    if (!project) return c.json({ error: "not_found" }, 404);

    const entities = listEntities(db, projectId);
    return c.json({ project, entities, summary: summarizeBoard(entities) });
  })
  .post("/api/ui/projects/:projectId/entities", async (c) => {
    const projectId = c.req.param("projectId");
    if (!getProject(db, projectId, getSessionUser(c)?.userId ?? null)) {
      return c.json({ error: "not_found" }, 404);
    }

    const parsed = v.safeParse(addRowBodySchema, await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    const entity = createEntity(db, {
      projectId,
      name: parsed.output.name,
      ...(parsed.output.contact ? { contact: parsed.output.contact } : {}),
      ...(parsed.output.channel ? { channel: parsed.output.channel } : {}),
      missing: parsed.output.missing ?? [],
      status: parsed.output.status ?? "intake",
    });
    return c.json({ entity }, 201);
  })
  .post("/api/ui/projects/:projectId/entities/bulk", async (c) => {
    const projectId = c.req.param("projectId");
    if (!getProject(db, projectId, getSessionUser(c)?.userId ?? null)) {
      return c.json({ error: "not_found" }, 404);
    }

    const parsed = v.safeParse(bulkBodySchema, await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    const actor = getSessionUser(c)?.userId ?? "ui";
    const result = await handleBulkIntake(projectId, parsed.output.csv, actor);
    return c.json(result, result.fatal ? 400 : 200);
  })
  .post("/api/ui/projects/:projectId/workflows", async (c) => {
    const projectId = c.req.param("projectId");
    if (!getProject(db, projectId, getSessionUser(c)?.userId ?? null)) {
      return c.json({ error: "not_found" }, 404);
    }

    const parsed = v.safeParse(workflowBodySchema, await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    const template = parsed.output.template as (typeof WORKFLOW_TEMPLATES)[number];
    if (!WORKFLOW_TEMPLATES.includes(template)) {
      return c.json({ error: "invalid_request" }, 400);
    }

    const runs = triggerWorkflow(db, projectId, template);
    return c.json({ runs }, 201);
  })
  // Approval flow (contract stage.ts). advanceStage / decideGate own
  // the semantics; curation for a catalog miss is explicit here so the
  // provider chain has one seam to hook into.
  .post("/api/ui/projects/:projectId/stage", async (c) => {
    const projectId = c.req.param("projectId");
    if (!getProject(db, projectId)) return c.json({ error: "not_found" }, 404);

    const parsed = v.safeParse(stageRequestSchema, await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    const result = advanceStage(projectId, parsed.output.to);
    if (!result.ok) return c.json({ error: result.error.code }, 409);
    return c.json({
      projectId,
      stage: result.value.stage,
      ...(result.value.pendingGate ? { pendingGate: result.value.pendingGate } : {}),
    });
  })
  .post("/api/ui/projects/:projectId/approve", async (c) => {
    const projectId = c.req.param("projectId");
    if (!getProject(db, projectId)) return c.json({ error: "not_found" }, 404);

    const parsed = v.safeParse(approveRequestSchema, await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    const { gate, decision, brief, entityIds } = parsed.output;
    const result = decideGate(projectId, gate, decision, { brief, entityIds });
    if (!result.ok) {
      const status = result.error.code === "not_found" ? 404 : 409;
      return c.json({ error: result.error.code }, status);
    }
    return c.json({
      projectId,
      stage: result.value.stage,
      ...(result.value.pendingGate ? { pendingGate: result.value.pendingGate } : {}),
      released: result.value.released,
      discarded: result.value.discarded,
    });
  })
  .post("/api/ui/projects/:projectId/curate", (c) => {
    const projectId = c.req.param("projectId");
    if (!getProject(db, projectId)) return c.json({ error: "not_found" }, 404);

    try {
      const { candidates } = curateProject(projectId);
      const project = getProject(db, projectId)!;
      return c.json({ projectId, candidates, stage: project.stage });
    } catch (err) {
      const message = err instanceof Error ? err.message : "curation failed";
      if (message.includes("no confirmed brief")) return c.json({ error: "no_brief" }, 409);
      return c.json({ error: "curation_failed" }, 500);
    }
  });
