/**
 * Project routes, protected with the Bearer API key middleware.
 *
 * Scopes:
 *   projects:read  -> list and read
 *   projects:write -> create and patch
 *   entities:read  -> list a project's entities
 *   entities:write -> create an entity in a project
 *
 * Bodies are validated with the valibot schemas from `@tarima/contract`
 * so the REST surface and the MCP surface accept exactly the same
 * shapes. A validation failure is 400 `{error:"invalid_request"}`, an
 * unknown id is 404 `{error:"not_found"}`.
 */
import { Hono } from "hono";
import * as v from "valibot";
import {
  approveRequestSchema,
  createEntitySchema,
  createProjectSchema,
  projectGoalSchema,
  stageRequestSchema,
} from "@tarima/contract";
import { db } from "../db";
import { requireApiKey } from "../middleware/require-api-key";
import { createEntity, listEntities } from "../services/entities";
import { advanceStage, decideGate } from "../services/approval";
import { curateProject } from "../services/curation";
import { createProject, getProject, listProjects, updateProject } from "../services/projects";

export const projectRoutes = new Hono()
  .use("/api/projects/*", requireApiKey(["projects:read", "projects:write"]))
  .get("/api/projects", requireApiKey(["projects:read"]), (c) => {
    return c.json({ projects: listProjects(db) });
  })
  .post("/api/projects", requireApiKey(["projects:write"]), async (c) => {
    const parsed = v.safeParse(createProjectSchema, await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    // The goal carries the brief (contract `projectGoalSchema`). The same
    // check runs on the browser surface, so both surfaces agree.
    const goal = parsed.output.goal;
    if (goal !== undefined && !v.safeParse(projectGoalSchema, goal).success) {
      return c.json({ error: "invalid_request" }, 400);
    }

    const project = createProject(db, parsed.output);
    return c.json({ project }, 201);
  })
  .get("/api/projects/:projectId", requireApiKey(["projects:read"]), (c) => {
    const project = getProject(db, c.req.param("projectId"));
    if (!project) return c.json({ error: "not_found" }, 404);
    return c.json({ project });
  })
  .patch("/api/projects/:projectId", requireApiKey(["projects:write"]), async (c) => {
    const parsed = v.safeParse(
      v.partial(createProjectSchema),
      await c.req.json().catch(() => null),
    );
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    const project = updateProject(db, c.req.param("projectId"), parsed.output);
    if (!project) return c.json({ error: "not_found" }, 404);
    return c.json({ project });
  })
  .get("/api/projects/:projectId/entities", requireApiKey(["entities:read"]), (c) => {
    const projectId = c.req.param("projectId");
    if (!getProject(db, projectId)) return c.json({ error: "not_found" }, 404);
    return c.json({ entities: listEntities(db, projectId) });
  })
  .post("/api/projects/:projectId/entities", requireApiKey(["entities:write"]), async (c) => {
    const projectId = c.req.param("projectId");
    if (!getProject(db, projectId)) return c.json({ error: "not_found" }, 404);

    // The path owns the project id; the body must not carry a second one.
    const parsed = v.safeParse(
      v.omit(createEntitySchema, ["projectId"]),
      await c.req.json().catch(() => null),
    );
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    const entity = createEntity(db, { ...parsed.output, projectId });
    return c.json({ entity }, 201);
  })
  // Bearer parity for the approval flow (contract stage.ts): the same
  // service functions as the session surface, minimal by design. The
  // UI routes under /api/ui/* are the primary surface.
  .post("/api/projects/:projectId/stage", requireApiKey(["projects:write"]), async (c) => {
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
  .post("/api/projects/:projectId/approve", requireApiKey(["projects:write"]), async (c) => {
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
  .post("/api/projects/:projectId/curate", requireApiKey(["projects:write"]), (c) => {
    const projectId = c.req.param("projectId");
    if (!getProject(db, projectId)) return c.json({ error: "not_found" }, 404);
    try {
      const { candidates } = curateProject(projectId);
      return c.json({ projectId, candidates, stage: getProject(db, projectId)!.stage });
    } catch (err) {
      const message = err instanceof Error ? err.message : "curation failed";
      if (message.includes("no confirmed brief")) return c.json({ error: "no_brief" }, 409);
      return c.json({ error: "curation_failed" }, 500);
    }
  });
