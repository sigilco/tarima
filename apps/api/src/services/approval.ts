/**
 * Approval flow service: the stage machine behind the two session
 * routes (contract `packages/contract/src/stage.ts`):
 *
 *   POST /api/ui/projects/:id/stage    advance (submit brief, start curation)
 *   POST /api/ui/projects/:id/approve  decide the pending gate
 *
 * Stage flow: brief -> spec_review -> curating -> shortlist_review
 * -> send_review -> running -> done. GATE_FOR_STAGE names the gate a
 * stage waits on.
 *
 * The send gate is what makes outreach HITL: approving it enqueues a
 * SEND_APPROVED step on every staged run (see packages/chase), which
 * is the only path that turns a staged draft into an outbox row. No
 * route in this module ever emits a send effect directly.
 */
import { and, eq } from "drizzle-orm";
import * as v from "valibot";
import {
  BRIEF_GOAL_KEY,
  GATE_FOR_STAGE,
  type ApprovalGate,
  type Brief,
  type ProjectStage,
  briefSchema,
} from "@tarima/contract";
import { enqueueStep, listSteps } from "@tarima/engine/journal";
import { db } from "../db";
import { entities, projects, workflows } from "../db/schema";
import { curateProject } from "./curation";

type FlowError =
  | { code: "not_found" }
  | { code: "invalid_stage"; stage: ProjectStage }
  | { code: "no_gate"; stage: ProjectStage }
  | { code: "wrong_gate"; gate: ApprovalGate; pending: ApprovalGate }
  | { code: "no_brief" }
  | { code: "invalid_brief" }
  | { code: "no_candidates" };

export type FlowResult<T> = { ok: true; value: T } | { ok: false; error: FlowError };

export interface GateOutcome {
  stage: ProjectStage;
  pendingGate?: ApprovalGate;
  released: number;
  discarded: number;
}

function projectRow(projectId: string) {
  return db.select().from(projects).where(eq(projects.id, projectId)).get();
}

function setStage(projectId: string, stage: ProjectStage): void {
  db.update(projects).set({ stage, updatedAt: Date.now() }).where(eq(projects.id, projectId)).run();
}

/**
 * POST /stage: advance the project.
 *   to=spec_review  submit the free-text notes as the draft spec and
 *     park in spec_review. The user confirms or edits at the gate.
 *   to=curating     legal once the spec gate approved; curation runs.
 */
export function advanceStage(
  projectId: string,
  to: "spec_review" | "curating",
): FlowResult<GateOutcome> {
  const row = projectRow(projectId);
  if (!row) return { ok: false, error: { code: "not_found" } };

  if (to === "spec_review") {
    setStage(projectId, "spec_review");
    return {
      ok: true,
      value: {
        stage: "spec_review",
        pendingGate: "spec",
        released: 0,
        discarded: 0,
      },
    };
  }

  if (row.stage !== "spec_review") {
    return {
      ok: false,
      error: { code: "invalid_stage", stage: row.stage as ProjectStage },
    };
  }
  setStage(projectId, "curating");
  const stage = runCuration(projectId);
  return {
    ok: true,
    value: {
      stage,
      pendingGate: GATE_FOR_STAGE[stage],
      released: 0,
      discarded: 0,
    },
  };
}

/**
 * Curation after a confirmed spec. A catalog miss parks the project in
 * `curating` (zero candidates); matching rows move it to the
 * shortlist gate.
 */
function runCuration(projectId: string): ProjectStage {
  let candidates = 0;
  try {
    candidates = curateProject(projectId).candidates;
  } catch (err) {
    console.warn("[flow] curation failed:", err instanceof Error ? err.message : err);
    return "curating";
  }
  if (candidates === 0) return "curating";
  setStage(projectId, "shortlist_review");
  return "shortlist_review";
}

/**
 * POST /approve: decide the pending gate.
 *   spec      approve (optionally with the edited brief) -> curation.
 *   shortlist approve (optionally cut to `entityIds`) -> send_review;
 *             kept candidates move to `pending` so the chase trigger
 *             picks them up.
 *   send      approve -> SEND_APPROVED on every staged run; reject ->
 *             SEND_REJECTED (the drafts are discarded).
 */
export function decideGate(
  projectId: string,
  gate: ApprovalGate,
  decision: "approve" | "reject",
  opts: { brief?: Brief; entityIds?: string[] } = {},
): FlowResult<GateOutcome> {
  const row = projectRow(projectId);
  if (!row) return { ok: false, error: { code: "not_found" } };
  const stage = row.stage as ProjectStage;

  const pending = GATE_FOR_STAGE[stage];
  if (!pending) return { ok: false, error: { code: "no_gate", stage } };
  if (pending !== gate) {
    return { ok: false, error: { code: "wrong_gate", gate, pending } };
  }

  switch (gate) {
    case "spec":
      return decideSpec(projectId, decision, opts.brief);
    case "shortlist":
      return decideShortlist(projectId, decision, opts.entityIds);
    case "send":
      return decideSend(projectId, decision);
  }
}

/** Spec gate: store the (edited) brief, then curation runs. */
function decideSpec(
  projectId: string,
  decision: "approve" | "reject",
  brief?: Brief,
): FlowResult<GateOutcome> {
  if (decision === "reject") {
    setStage(projectId, "brief");
    return { ok: true, value: { stage: "brief", released: 0, discarded: 0 } };
  }

  const row = projectRow(projectId)!;
  const stored = brief ?? draftBriefFromNotes(row.goal ?? {});
  if (!stored) return { ok: false, error: { code: "no_brief" } };
  const check = v.safeParse(briefSchema, stored);
  if (!check.success) return { ok: false, error: { code: "invalid_brief" } };

  const goal = { ...row.goal, [BRIEF_GOAL_KEY]: check.output };
  db.update(projects).set({ goal, updatedAt: Date.now() }).where(eq(projects.id, projectId)).run();

  setStage(projectId, "curating");
  const stage = runCuration(projectId);
  return {
    ok: true,
    value: {
      stage,
      pendingGate: GATE_FOR_STAGE[stage],
      released: 0,
      discarded: 0,
    },
  };
}

/**
 * The draft brief parsed out of the free-text notes at spec_review
 * submit time. v0 keeps the deterministic fallback: the notes ride as
 * `notes` and the defaults below give the confirm form something to
 * prefill. The LLM parse replaces this when a provider is configured
 * (the `parseBrief` seam already exists in @tarima/llm).
 */
function draftBriefFromNotes(goal: Record<string, unknown>): Brief | undefined {
  const notes = typeof goal.notes === "string" ? goal.notes : undefined;
  if (!notes?.trim()) return undefined;
  return {
    eventType: "meetup",
    city: "Malaga",
    headcount: 20,
    budgetAmount: 5000,
    currency: "EUR",
    notes: notes.slice(0, 4000),
  };
}

/** Shortlist gate: cut to the kept ids (or keep all) and open the send gate. */
function decideShortlist(
  projectId: string,
  decision: "approve" | "reject",
  entityIds?: string[],
): FlowResult<GateOutcome> {
  const candidates = db
    .select()
    .from(entities)
    .where(and(eq(entities.projectId, projectId), eq(entities.status, "candidate")))
    .all();

  if (decision === "reject") {
    for (const row of candidates) {
      db.update(entities)
        .set({ status: "failed", updatedAt: Date.now() })
        .where(eq(entities.id, row.id))
        .run();
    }
    setStage(projectId, "brief");
    return {
      ok: true,
      value: { stage: "brief", released: 0, discarded: candidates.length },
    };
  }

  const keep = entityIds ? new Set(entityIds) : null;
  let released = 0;
  let discarded = 0;
  for (const row of candidates) {
    const kept = !keep || keep.has(row.id);
    db.update(entities)
      .set({ status: kept ? "pending" : "failed", updatedAt: Date.now() })
      .where(eq(entities.id, row.id))
      .run();
    if (kept) released++;
    else discarded++;
  }
  if (released === 0) return { ok: false, error: { code: "no_candidates" } };

  setStage(projectId, "send_review");
  return {
    ok: true,
    value: { stage: "send_review", pendingGate: "send", released, discarded },
  };
}

/**
 * Send gate: the only place a staged draft becomes a send. Enqueues a
 * decision step per staged run (the `#n` suffix keeps the per-run step
 * key unique while resolving to the same gate handler); the chase
 * handler does the rest, and the outbox idempotency key keeps a
 * double-click harmless.
 */
function decideSend(projectId: string, decision: "approve" | "reject"): FlowResult<GateOutcome> {
  const running = db
    .select()
    .from(workflows)
    .where(and(eq(workflows.type, "chase-deliverables"), eq(workflows.status, "running")))
    .all()
    .filter((run) => run.state === "outreach_staged");

  let touched = 0;
  for (const run of running) {
    const step = stagedGateStep(run.id);
    if (!step) continue;
    // Key suffix keeps (runId, stepKey) unique across decisions; the
    // runner strips a numeric '#n' suffix and resolves the gate
    // handler, so the decision lands on the same code path as the park.
    const suffix = pendingSuffix(db, run.id);
    enqueueStep(db, run.id, `chase.outreach_staged#${suffix}`, {
      ...step.input,
      event: decision === "approve" ? "SEND_APPROVED" : "SEND_REJECTED",
    });
    touched++;
  }

  const stage: ProjectStage = decision === "approve" ? "running" : "curating";
  setStage(projectId, stage);
  return {
    ok: true,
    value: {
      stage,
      pendingGate: undefined,
      released: decision === "approve" ? touched : 0,
      discarded: decision === "approve" ? 0 : touched,
    },
  };
}

/** A fresh numeric suffix for a run's gate decision step. */
function pendingSuffix(
  db: typeof import("../db/schema") extends never ? never : Parameters<typeof enqueueStep>[0],
  runId: string,
): number {
  const rows = listSteps(db, runId).filter((step) =>
    step.stepKey.startsWith("chase.outreach_staged"),
  );
  return rows.length + 1;
}

/** The pending gate step of a run, carrying the staged draft in its input. */
function stagedGateStep(runId: string) {
  const pending = listSteps(db, runId).filter(
    (step) => step.stepKey.startsWith("chase.outreach_staged") && step.status === "pending",
  );
  const step = pending.at(-1);
  if (!step) return undefined;
  const input = step.input as Record<string, unknown>;
  return typeof input.draft === "object" && input.draft !== null ? { input } : undefined;
}
