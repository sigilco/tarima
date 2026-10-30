import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { openDb } from "@tarima/engine/db";
import { createRun, getWorkflow, listSteps } from "@tarima/engine/journal";
import { runOnce } from "@tarima/engine/runner";
import { stubLlm } from "./llm";
import { registerChase } from "./register";

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

describe("chase on the engine", () => {
  it("runs chase-deliverables happy path through the real runner", async () => {
    const { db } = setup();
    const handlers = registerChase(stubLlm);
    const runId = createRun(db, {
      type: "chase-deliverables",
      state: "intake",
      context: { entityName: "Blue Note", contactEmail: "booker@bluenote.test" },
      initialSteps: [
        { key: "chase.intake", input: { entityName: "Blue Note", to: "booker@bluenote.test" } },
      ],
    });
    // Drive until the run parks in the send gate. The staged draft must
    // NOT appear in the outbox: nothing is sent before approval.
    for (let i = 0; i < 12; i++) {
      const ran = await runOnce(db, handlers);
      if (ran === 0) break;
    }
    const wf = getWorkflow(db, runId);
    expect(wf?.status).toBe("running");
    expect(wf?.state).toBe("outreach_staged");
    // Only the effect echo rows exist; no email.send before approval.
    const rows = db
      .all<{ type: string }>(sql`SELECT type FROM outbox`)
      .filter((r) => r.type === "email.send");
    expect(rows).toHaveLength(0);

    // The send gate approves: the run completes and the send lands.
    const gate = listSteps(db, runId).find((s) => s.stepKey.startsWith("chase.outreach_staged"));
    expect(gate).toBeDefined();
    const draft = (gate!.input as { draft?: Record<string, unknown> }).draft ?? {};
    // Re-enter the gate step the way the approve route does: the next
    // step input carries the decision and the staged draft.
    db.run(
      sql`UPDATE steps SET status = 'pending', run_at = 0, output = NULL, input = ${JSON.stringify({ ...gate!.input, event: "SEND_APPROVED", draft })} WHERE id = ${gate!.id}`,
    );
    for (let i = 0; i < 12; i++) {
      const ran = await runOnce(db, handlers);
      if (ran === 0) break;
    }
    expect(getWorkflow(db, runId)?.status).toBe("done");
    expect(getWorkflow(db, runId)?.state).toBe("done");
    const outboxRows = db.all<{ idempotency_key: string }>(sql`SELECT idempotency_key FROM outbox`);
    expect(outboxRows.map((r) => r.idempotency_key)).toContain(`chase:send:${runId}:initial`);
  });

  it("await_reply + followup branch enqueues delayed follow-up step", async () => {
    const { db } = setup();
    const handlers = registerChase(stubLlm);
    const runId = createRun(db, {
      type: "chase-deliverables",
      state: "await_reply",
      context: { entityName: "La Paloma", followUps: 0, maxFollowUps: 2 },
      initialSteps: [
        { key: "chase.await_reply", input: { event: "FOLLOWUP_DUE", entityName: "La Paloma" } },
      ],
    });
    await runOnce(db, handlers); // -> followup state step
    await runOnce(db, handlers); // followup sends, back to await_reply (delayed)
    // The re-entered await_reply step is delayed; before the delay elapses
    // the run should still sit in await_reply with followUps bumped.
    const wf = getWorkflow(db, runId);
    expect(wf?.state).toBe("await_reply");
    expect(wf?.context.followUps).toBe(1);
    const stepRows = listSteps(db, runId);
    const awaitStep = stepRows.find(
      (s) => s.stepKey.startsWith("chase.await_reply") && s.status === "pending",
    );
    expect(awaitStep).toBeDefined();
    expect(awaitStep!.runAt).toBeGreaterThan(Date.now());
  });

  it("invalid reply (low confidence) fails the run", async () => {
    const { db } = setup();
    const handlers = registerChase(stubLlm);
    const runId = createRun(db, {
      type: "chase-deliverables",
      state: "parse",
      initialSteps: [{ key: "chase.parse", input: { body: "what? no idea what you mean" } }],
    });
    await runOnce(db, handlers); // parse -> REPLY_INVALID -> failed
    expect(getWorkflow(db, runId)?.status).toBe("failed");
    expect(getWorkflow(db, runId)?.state).toBe("failed");
  });

  it("crash between claim and complete is recovered by a fresh runner", async () => {
    const { db } = setup();
    const handlers = registerChase(stubLlm);
    const runId = createRun(db, {
      type: "chase-deliverables",
      state: "outreach",
      initialSteps: [
        { key: "chase.outreach", input: { entityName: "Casa Limon", to: "x@casa.test" } },
      ],
    });
    // Claim then die: leave the step running with an expired lease.
    db.run(
      sql`UPDATE steps SET status = 'running', lease_owner = 'dead', lease_expires_at = ${Date.now() - 1000}`,
    );
    for (let i = 0; i < 12; i++) {
      const ran = await runOnce(db, handlers);
      if (ran === 0) break;
    }
    // The run recovers into the send gate and parks there, still healthy.
    expect(getWorkflow(db, runId)?.status).toBe("running");
    expect(getWorkflow(db, runId)?.state).toBe("outreach_staged");
    // Approve to let the recovered run finish.
    const gate = listSteps(db, runId).find(
      (s) => s.stepKey.startsWith("chase.outreach_staged") && s.status === "pending",
    );
    expect(gate).toBeDefined();
    const draft = (gate!.input as { draft?: Record<string, unknown> }).draft ?? {};
    db.run(
      sql`UPDATE steps SET status = 'pending', run_at = 0, input = ${JSON.stringify({ ...gate!.input, event: "SEND_APPROVED", draft })} WHERE id = ${gate!.id}`,
    );
    for (let i = 0; i < 12; i++) {
      const ran = await runOnce(db, handlers);
      if (ran === 0) break;
    }
    expect(getWorkflow(db, runId)?.status).toBe("done");
  });
});
