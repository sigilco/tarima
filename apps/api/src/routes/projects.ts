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
import { createEntitySchema, createProjectSchema, projectGoalSchema } from "@tarima/contract";
import { db } from "../db";
import { requireApiKey } from "../middleware/require-api-key";
import { createEntity, listEntities } from "../services/entities";
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
  });
