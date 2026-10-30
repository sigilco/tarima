/**
 * Workflow service: trigger the chase-deliverables template and read
 * back a run's journal.
 *
 * The durable journal lives in the `workflows` / `steps` tables and is
 * written through `@tarima/engine/journal` (`createRun`, `enqueueStep`,
 * `getWorkflow`, `listSteps`). The engine package owns the SQL; this
 * module owns the domain decision of WHICH rows get a run and with
 * what context.
 *
 * Trigger semantics: one run per entity of the project that is still
 * waiting to be chased. "Waiting" is expressed in the db status
 * vocabulary (the engine's own): `pending` and `intake`. Entities that
 * already advanced (`chasing`, `await_reply`, ...) are left alone, so
 * triggering twice does not duplicate outreach.
 *
 * Stage interaction: a project filled by CSV intake or a manual add-row
 * never walks brief -> spec -> curate -> shortlist, so its stage would
 * stay `brief` and the send gate would never be decidable. Starting a
 * chase on such a project moves it to `send_review` (the stages below
 * the gate); a project already past the gate (`running`, `done`) keeps
 * its stage, so a re-trigger inherits the earlier approval. The
 * shortlist path itself is untouched.
 *
 * The initial step key is `chase.intake`, which is the step the chase
 * handler registry (`@tarima/chase/register`) resolves for the intake
 * state of the chase-deliverables template.
 */
import { eq } from "drizzle-orm";
import { createRun, enqueueStep, getWorkflow, listSteps } from "@tarima/engine/journal";
import { CHASE_DELIVERABLES } from "@tarima/chase/template";
import { entities, projects, type EntityStatus } from "../db/schema";
import { listEntitiesByStatus } from "./entities";
import type { ApiDb } from "./projects";

/** The only template the api can trigger today. */
export const WORKFLOW_TEMPLATES = [CHASE_DELIVERABLES.type] as const;
export type WorkflowTemplate = (typeof WORKFLOW_TEMPLATES)[number];

/** The initial step key of the chase-deliverables template. */
const CHASE_INTAKE_STEP = "chase.intake";

/** Db statuses that still wait for a chase run. */
const INTAKE_STATUSES: EntityStatus[] = ["pending", "intake"];

/** Stages a start-chase moves out of into the send gate. */
export const PRE_GATE_STAGES: readonly string[] = [
  "brief",
  "spec_review",
  "curating",
  "shortlist_review",
];

/** A triggered run, as returned to the caller. */
export interface TriggeredRun {
  runId: string;
  entityId: string;
}

/**
 * Start a chase-deliverables run for every entity of `projectId` that is
 * still waiting. The run context carries what the chase handlers need:
 * the entity id, its name, its contact email and its goal.
 *
 * A project that has not reached the send gate yet moves to
 * `send_review`, so the staged drafts are decidable at the gate. A
 * project already `running` or `done` keeps its stage, so a re-trigger
 * inherits the earlier approval.
 */
export function triggerWorkflow(
  db: ApiDb,
  projectId: string,
  template: WorkflowTemplate,
): TriggeredRun[] {
  if (template !== CHASE_DELIVERABLES.type) {
    throw new Error(`unknown workflow template: ${template}`);
  }

  const waiting = listEntitiesByStatus(db, projectId, INTAKE_STATUSES);
  const runs: TriggeredRun[] = [];

  for (const entity of waiting) {
    const row = db.select().from(entities).where(eq(entities.id, entity.id)).get();
    const goal = (row?.goal ?? {}) as Record<string, unknown>;
    const runId = createRun(db, {
      type: template,
      state: "intake",
      context: {
        entityId: entity.id,
        entityName: entity.name,
        contactEmail: entity.contact ?? null,
        goal,
      },
    });
    enqueueStep(db, runId, CHASE_INTAKE_STEP, {
      entityId: entity.id,
      entityName: entity.name,
      goal,
    });
    runs.push({ runId, entityId: entity.id });
  }

  const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (project && PRE_GATE_STAGES.includes(project.stage)) {
    db.update(projects)
      .set({ stage: "send_review", updatedAt: Date.now() })
      .where(eq(projects.id, projectId))
      .run();
  }

  return runs;
}

/** A run plus its journal steps, as returned by GET /api/workflows/:runId. */
export interface WorkflowView {
  run: {
    id: string;
    type: string;
    status: string;
    state: string;
    context: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
  steps: Array<{
    id: string;
    stepKey: string;
    status: string;
    input: Record<string, unknown>;
    output: Record<string, unknown> | null;
    error: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

/** Read a run and its steps, or undefined when the run id is unknown. */
export function getWorkflowView(db: ApiDb, runId: string): WorkflowView | undefined {
  const run = getWorkflow(db, runId);
  if (!run) return undefined;

  return {
    run: {
      id: run.id,
      type: run.type,
      status: run.status,
      state: run.state,
      context: run.context ?? {},
      createdAt: new Date(run.createdAt).toISOString(),
      updatedAt: new Date(run.updatedAt).toISOString(),
    },
    steps: listSteps(db, runId).map((step) => ({
      id: step.id,
      stepKey: step.stepKey,
      status: step.status,
      input: step.input ?? {},
      output: step.output ?? null,
      error: step.error ?? null,
      createdAt: new Date(step.createdAt).toISOString(),
      updatedAt: new Date(step.updatedAt).toISOString(),
    })),
  };
}
