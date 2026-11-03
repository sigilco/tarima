import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { openDb } from "./db";
import { outbox } from "./schema.js";
import {
  claimDueSteps,
  completeStep,
  createRun,
  getWorkflow,
  listSteps,
  recoverExpiredLeases,
} from "./journal";

function setup() {
  const { db, sqlite } = openDb({ url: ":memory:" });
  sqlite.exec(`CREATE TABLE workflows (
    id TEXT PRIMARY KEY, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'running',
    state TEXT NOT NULL DEFAULT '', context TEXT NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
  sqlite.exec(`CREATE TABLE steps (
    id TEXT PRIMARY KEY, run_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_key TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
    input TEXT NOT NULL DEFAULT '{}', output TEXT, retries INTEGER NOT NULL DEFAULT 0,
    lease_owner TEXT, lease_expires_at INTEGER, run_at INTEGER NOT NULL, error TEXT,
    created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`);
  sqlite.exec(`CREATE UNIQUE INDEX idx_steps_run_key ON steps (run_id, step_key)`);
  sqlite.exec(`CREATE TABLE outbox (
    id TEXT PRIMARY KEY, idempotency_key TEXT NOT NULL UNIQUE, type TEXT NOT NULL,
    payload TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL, sent_at INTEGER)`);
  return { db, sqlite };
}

describe("journal", () => {
  it("creates a run with initial steps", () => {
    const { db } = setup();
    const runId = createRun(db, { type: "test", initialSteps: [{ key: "a" }] });
    const wf = getWorkflow(db, runId);
    expect(wf?.status).toBe("running");
    expect(listSteps(db, runId)).toHaveLength(1);
  });

  it("claims due steps with a lease and persists output before advancing", () => {
    const { db } = setup();
    const runId = createRun(db, { type: "test", initialSteps: [{ key: "a" }] });
    const claimed = claimDueSteps(db, "w1", 60_000, 10);
    expect(claimed).toHaveLength(1);
    completeStep(db, claimed[0]!.id, {
      ok: true,
      result: { output: { x: 1 }, nextState: "s2", emit: [{ idempotencyKey: "k1", type: "send" }] },
    });
    const step = listSteps(db, runId)[0]!;
    expect(step.status).toBe("done");
    expect(step.output).toEqual({ x: 1 });
    const wf = getWorkflow(db, runId);
    expect(wf?.state).toBe("s2");
    // run auto-completes (no pending steps)
    expect(wf?.status).toBe("done");
  });

  it("does not double-claim a leased step", () => {
    const { db } = setup();
    createRun(db, { type: "test", initialSteps: [{ key: "a" }] });
    expect(claimDueSteps(db, "w1", 60_000, 10)).toHaveLength(1);
    expect(claimDueSteps(db, "w2", 60_000, 10)).toHaveLength(0);
  });

  it("requeues a step whose lease expired (crash between claim and complete)", () => {
    const { db } = setup();
    createRun(db, { type: "test", initialSteps: [{ key: "a" }] });
    const [claimed] = claimDueSteps(db, "dead-worker", 60_000, 10);
    expect(claimed).toBeDefined();
    // nothing completes; simulate process death by backdating the lease
    const past = Date.now() - 1;
    db.run(sql`UPDATE steps SET lease_expires_at = ${past}`);
    expect(claimDueSteps(db, "new-worker", 60_000, 10)).toHaveLength(1);
    // recover sweep also finds nothing left (already re-claimed by new worker)
    expect(recoverExpiredLeases(db)).toBe(0);
  });

  it("enforces outbox idempotency by key", () => {
    const { db } = setup();
    const runId = createRun(db, { type: "test", initialSteps: [{ key: "a" }] });
    const [s1] = claimDueSteps(db, "w1", 60_000, 10);
    completeStep(db, s1!.id, {
      ok: true,
      result: { emit: [{ idempotencyKey: "same", type: "send" }], nextSteps: [{ key: "b" }] },
    });
    const [s2] = claimDueSteps(db, "w1", 60_000, 10);
    completeStep(db, s2!.id, {
      ok: true,
      result: { emit: [{ idempotencyKey: "same", type: "send" }] },
    });
    const rows = db.select().from(outbox).all();
    expect(rows).toHaveLength(1);
    expect(getWorkflow(db, runId)?.status).toBe("done");
  });

  it("fails the run after 3 step failures", () => {
    const { db } = setup();
    const runId = createRun(db, { type: "test", initialSteps: [{ key: "a" }] });
    for (let i = 0; i < 3; i++) {
      // Failed steps fall back to pending with backoff so the runner retries.
      const [s] = claimDueSteps(db, "w1", 60_000, 10);
      completeStep(db, s!.id, { ok: false, error: "boom" });
      if (i < 2) {
        db.run(
          sql`UPDATE steps SET status = 'pending', run_at = ${Date.now()} WHERE run_id = ${runId} AND status = 'failed'`,
        );
      }
    }
    expect(getWorkflow(db, runId)?.status).toBe("failed");
  });
});
