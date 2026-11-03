/**
 * Workflow routes, protected with the Bearer API key middleware.
 *
 * Scopes:
 *   workflows:write -> trigger a workflow
 *   workflows:read  -> read a run and its journal steps
 *
 * Triggering writes to the durable journal through
 * `@tarima/engine/journal`; the domain decision of which rows get a
 * run lives in the workflow service. The chase step handlers that
 * consume those steps are registered by `@tarima/chase/register`; the
 * api only writes the journal here, the worker executes it.
 */
import { Hono } from "hono";
import * as v from "valibot";
import { GATE_FOR_STAGE, type ProjectStage } from "@tarima/contract";
import { db } from "../db";
import { requireApiKey } from "../middleware/require-api-key";
import { getProject } from "../services/projects";
import { getWorkflowView, triggerWorkflow, WORKFLOW_TEMPLATES } from "../services/workflows";

const triggerSchema = v.object({
  template: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
});

export const workflowRoutes = new Hono()
  .post("/api/projects/:projectId/workflows", requireApiKey(["workflows:write"]), async (c) => {
    const projectId = c.req.param("projectId");
    if (!getProject(db, projectId)) return c.json({ error: "not_found" }, 404);

    const parsed = v.safeParse(triggerSchema, await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid_request" }, 400);

    const template = parsed.output.template as (typeof WORKFLOW_TEMPLATES)[number];
    if (!WORKFLOW_TEMPLATES.includes(template)) {
      return c.json({ error: "invalid_request" }, 400);
    }

    const runs = triggerWorkflow(db, projectId, template);
    const project = getProject(db, projectId)!;
    const pendingGate = GATE_FOR_STAGE[project.stage as ProjectStage];
    return c.json(
      {
        runs,
        stage: project.stage,
        ...(pendingGate ? { pendingGate } : {}),
      },
      201,
    );
  })
  .get("/api/workflows/:runId", requireApiKey(["workflows:read"]), (c) => {
    const view = getWorkflowView(db, c.req.param("runId"));
    if (!view) return c.json({ error: "not_found" }, 404);
    return c.json(view);
  });
