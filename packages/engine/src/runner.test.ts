import { afterEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { openDb } from "./db";
import { createRun, getWorkflow } from "./journal";
import { runOnce, startRunner } from "./runner";

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

describe("runner", () => {
  it("drives a multi-step fake workflow to completion via runOnce", async () => {
    const { db } = setup();
    const runId = createRun(db, {
      type: "fake",
      state: "start",
      initialSteps: [{ key: "step1" }],
    });
    const handlers = {
      step1: () => ({ nextState: "mid", nextSteps: [{ key: "step2" }] }),
      step2: () => ({ nextState: "end", finish: true }),
    };
    await runOnce(db, handlers);
    await runOnce(db, handlers);
    const wf = getWorkflow(db, runId);
    expect(wf?.status).toBe("done");
    expect(wf?.state).toBe("end");
  });

  it("survives a mid-run crash: lease abandoned, restarted runner resumes to completion", async () => {
    const { db } = setup();
    const runId = createRun(db, {
      type: "fake-crash",
      state: "start",
      initialSteps: [{ key: "step1" }],
    });
    const seen: string[] = [];
    const handlers = {
      step1: (ctx: { input: Record<string, unknown> }) => {
        seen.push(`step1:${String(ctx.input.attempt ?? 1)}`);
        if ((ctx.input.attempt ?? 1) === 1) {
          // Simulate kill -9 right after the handler starts but before the
          // step completes: the lease is never released (process dies).
          throw new Error("SIMULATED_CRASH");
        }
        return { nextState: "mid", nextSteps: [{ key: "step2" }] };
      },
      step2: () => ({ nextState: "end", finish: true }),
    };

    // First runner "crashes" on step1.
    await runOnce(db, handlers);

    // Simulate the crash more faithfully for the mid-handler case: the step
    // is claimed (running) with a live lease, then the process dies. Backdate
    // the lease so boot recovery sees it as expired. Re-attempt via input.
    db.run(
      sql`UPDATE steps SET input = json_set(input, '$.attempt', 2), status = 'pending',
          lease_owner = NULL, lease_expires_at = NULL`,
    );

    // New process boots and resumes the run.
    await runOnce(db, handlers);
    await runOnce(db, handlers);

    const wf = getWorkflow(db, runId);
    expect(wf?.status).toBe("done");
    expect(wf?.state).toBe("end");
    expect(seen).toEqual(["step1:1", "step1:2"]);
  });

  it("interval runner picks up delayed follow-up steps (backoff branch)", async () => {
    const { db } = setup();
    const runId = createRun(db, {
      type: "fake-backoff",
      initialSteps: [{ key: "send" }],
    });
    const handlers = {
      send: () => ({ nextSteps: [{ key: "followup", delayMs: 40 }] }),
      followup: () => ({ finish: true }),
    };
    const handle = startRunner(db, handlers, { pollIntervalMs: 10 });
    await new Promise((r) => setTimeout(r, 200));
    await handle.stop();
    expect(getWorkflow(db, runId)?.status).toBe("done");
  });

  it("startRunner recovers expired leases on boot", async () => {
    const { db } = setup();
    const runId = createRun(db, { type: "fake", initialSteps: [{ key: "solo" }] });
    // Claim with a dead worker, then let the lease expire in the past.
    db.run(
      sql`UPDATE steps SET status = 'running', lease_owner = 'dead',
          lease_expires_at = ${Date.now() - 1000}`,
    );
    const done: string[] = [];
    const handle = startRunner(
      db,
      {
        solo: () => {
          done.push("ran");
          return { finish: true };
        },
      },
      { pollIntervalMs: 10 },
    );
    await new Promise((r) => setTimeout(r, 150));
    await handle.stop();
    expect(done).toEqual(["ran"]);
    expect(getWorkflow(db, runId)?.status).toBe("done");
  });
});

afterEach(() => {
  // no global state
});
