import { and, eq, inArray, isNull, lte, or, sql, like } from "drizzle-orm";
import type { EngineDb } from "./db";
import { outbox, steps, workflows } from "@tarima/api/db/schema";
import type { ClaimedStep, StepResult, StepStatus, WorkflowStatus } from "./types";

export function nowMs(): number {
  return Date.now();
}

function id(): string {
  return crypto.randomUUID();
}

export interface CreateRunInput {
  id?: string;
  type: string;
  state?: string;
  context?: Record<string, unknown>;
  /** Initial step keys to enqueue. */
  initialSteps?: Array<{ key: string; input?: Record<string, unknown> }>;
}

export function createRun(db: EngineDb, input: CreateRunInput): string {
  const runId = input.id ?? id();
  const ts = nowMs();
  db.transaction((tx) => {
    tx.insert(workflows)
      .values({
        id: runId,
        type: input.type,
        status: "running",
        state: input.state ?? "",
        context: input.context ?? {},
        createdAt: ts,
        updatedAt: ts,
      })
      .run();
    for (const step of input.initialSteps ?? []) {
      enqueueStep(tx, runId, step.key, step.input);
    }
  });
  return runId;
}

export function enqueueStep(
  db: EngineDb,
  runId: string,
  stepKey: string,
  input: Record<string, unknown> = {},
  runAt: number = nowMs(),
): string {
  const stepId = id();
  const ts = nowMs();
  db.insert(steps)
    .values({
      id: stepId,
      runId,
      stepKey,
      status: "pending",
      input,
      runAt,
      createdAt: ts,
      updatedAt: ts,
    })
    .run();
  return stepId;
}

/**
 * Atomically claim due steps: pending with runAt <= now, or running with an
 * expired lease (crash recovery between sweeps). Sets a TTL lease.
 */
export function claimDueSteps(
  db: EngineDb,
  workerId: string,
  leaseTtlMs: number,
  limit: number,
): ClaimedStep[] {
  const now = nowMs();
  const claimedIds = db.transaction((tx): string[] => {
    const candidates = tx
      .select({ id: steps.id })
      .from(steps)
      .where(
        and(
          or(
            and(eq(steps.status, "pending"), lte(steps.runAt, now)),
            and(eq(steps.status, "running"), lte(steps.leaseExpiresAt, now)),
          ),
        ),
      )
      .limit(limit)
      .all();
    const ids = candidates.map((c) => c.id);
    for (const stepId of ids) {
      tx.update(steps)
        .set({
          status: "running",
          leaseOwner: workerId,
          leaseExpiresAt: now + leaseTtlMs,
          updatedAt: now,
        })
        .where(eq(steps.id, stepId))
        .run();
    }
    return ids;
  });
  if (claimedIds.length === 0) return [];
  const rows = db
    .select({
      id: steps.id,
      runId: steps.runId,
      stepKey: steps.stepKey,
      input: steps.input,
      workflowType: workflows.type,
      state: workflows.state,
      context: workflows.context,
    })
    .from(steps)
    .innerJoin(workflows, eq(steps.runId, workflows.id))
    .where(inArray(steps.id, claimedIds))
    .all();
  return rows as ClaimedStep[];
}

export interface StepOutcome {
  ok: boolean;
  result?: StepResult;
  error?: string;
}

/**
 * Persist a step outcome. Output is written in the same transaction as the
 * status flip, state advance, child enqueues and outbox emits: if the
 * process dies mid-transaction none of it lands and the lease expiry
 * re-queues the step.
 */
export function completeStep(db: EngineDb, stepId: string, outcome: StepOutcome): void {
  const now = nowMs();
  db.transaction((tx) => {
    const [step] = tx.select().from(steps).where(eq(steps.id, stepId)).all();
    if (!step || step.status !== "running") return;
    if (!outcome.ok) {
      tx.update(steps)
        .set({
          status: "failed",
          retries: step.retries + 1,
          leaseOwner: null,
          leaseExpiresAt: null,
          error: outcome.error ?? "unknown error",
          updatedAt: now,
        })
        .where(eq(steps.id, stepId))
        .run();
      if (step.retries + 1 >= 3) {
        tx.update(workflows)
          .set({ status: "failed", updatedAt: now })
          .where(eq(workflows.id, step.runId))
          .run();
      }
      return;
    }
    const result = outcome.result ?? {};
    tx.update(steps)
      .set({
        status: "done",
        output: result.output ?? {},
        leaseOwner: null,
        leaseExpiresAt: null,
        error: null,
        updatedAt: now,
      })
      .where(eq(steps.id, stepId))
      .run();
    for (const next of result.nextSteps ?? []) {
      // Step keys are unique per run; loops (e.g. await_reply -> followup ->
      // await_reply) re-enter the same key, so suffix on conflict. The
      // runner strips the '#n' suffix when resolving the handler.
      try {
        enqueueStep(tx, step.runId, next.key, next.input ?? {}, now + (next.delayMs ?? 0));
      } catch {
        const [{ count }] = tx
          .select({ count: sql<number>`count(*)` })
          .from(steps)
          .where(and(eq(steps.runId, step.runId), like(steps.stepKey, `${next.key}%`)))
          .all();
        enqueueStep(
          tx,
          step.runId,
          `${next.key}#${count + 1}`,
          next.input ?? {},
          now + (next.delayMs ?? 0),
        );
      }
    }
    for (const emit of result.emit ?? []) {
      tx.insert(outbox)
        .values({
          id: id(),
          idempotencyKey: emit.idempotencyKey,
          type: emit.type,
          payload: emit.payload ?? {},
          status: "pending",
          createdAt: now,
        })
        .onConflictDoNothing()
        .run();
    }
    const runDone = result.finish === true;
    if (runDone || result.nextState !== undefined) {
      const finalStatus = result.nextState === "failed" ? "failed" : runDone ? "done" : undefined;
      tx.update(workflows)
        .set({
          state: result.nextState ?? sql`${workflows.state}`,
          status: finalStatus ?? sql`${workflows.status}`,
          context: result.contextPatch
            ? sql`json_patch(${workflows.context}, ${JSON.stringify(result.contextPatch)})`
            : sql`${workflows.context}`,
          updatedAt: now,
        })
        .where(eq(workflows.id, step.runId))
        .run();
    }
    // Auto-complete the run when no pending/running steps remain and the
    // handler did not explicitly keep it alive.
    if (!runDone) {
      const [{ count }] = tx
        .select({ count: sql<number>`count(*)` })
        .from(steps)
        .where(and(eq(steps.runId, step.runId), inArray(steps.status, ["pending", "running"])))
        .all();
      if (count === 0) {
        tx.update(workflows)
          .set({ status: "done", updatedAt: now })
          .where(eq(workflows.id, step.runId))
          .run();
      }
    }
  });
}

/** Boot recovery: requeue running steps whose lease expired, and any
 * running step on startup (single-writer assumption). */
export function recoverExpiredLeases(db: EngineDb, now: number = nowMs()): number {
  return db.transaction((tx): number => {
    const res = tx
      .update(steps)
      .set({ status: "pending", leaseOwner: null, leaseExpiresAt: null, updatedAt: now })
      .where(
        and(
          eq(steps.status, "running"),
          or(isNull(steps.leaseExpiresAt), lte(steps.leaseExpiresAt, now)),
        ),
      )
      .run();
    return res.changes;
  });
}

export function markWorkflow(
  db: EngineDb,
  runId: string,
  patch: { state?: string; status?: WorkflowStatus },
): void {
  const now = nowMs();
  db.update(workflows)
    .set({ ...patch, updatedAt: now })
    .where(eq(workflows.id, runId))
    .run();
}

export function getWorkflow(db: EngineDb, runId: string) {
  const [row] = db.select().from(workflows).where(eq(workflows.id, runId)).all();
  return row;
}

export function listSteps(db: EngineDb, runId: string) {
  return db.select().from(steps).where(eq(steps.runId, runId)).all();
}

export function pendingOutbox(db: EngineDb, limit = 100) {
  return db.select().from(outbox).where(eq(outbox.status, "pending")).limit(limit).all();
}

/** Idempotent side-effect dispatch seam. The app wires a real sender later;
 * engine tests use an in-memory recorder. */
export function dispatchOutbox(
  db: EngineDb,
  send: (row: {
    idempotencyKey: string;
    type: string;
    payload: Record<string, unknown>;
  }) => Promise<void> | void,
): Promise<number> {
  const rows = pendingOutbox(db);
  let sent = 0;
  return (async () => {
    for (const row of rows) {
      const already = db
        .select({ id: outbox.id })
        .from(outbox)
        .where(and(eq(outbox.idempotencyKey, row.idempotencyKey), eq(outbox.status, "sent")))
        .all();
      if (already.length > 0) {
        db.update(outbox)
          .set({ status: "sent", sentAt: nowMs() })
          .where(eq(outbox.id, row.id))
          .run();
        continue;
      }
      try {
        await send({ idempotencyKey: row.idempotencyKey, type: row.type, payload: row.payload });
        db.update(outbox)
          .set({ status: "sent", sentAt: nowMs() })
          .where(eq(outbox.id, row.id))
          .run();
        sent += 1;
      } catch {
        // stays pending; retried by a later sweep
      }
    }
    return sent;
  })();
}

export type { StepStatus, WorkflowStatus };
