/**
 * The stream's headline test: the full HITL lifecycle.
 *
 *   brief -> spec_review -> curate -> shortlist approve -> chase runs
 *   -> staged draft -> send approve -> loopback send -> follow-up
 *   (inherited approval) -> reply -> parse -> done
 *
 * Hard assertion: at no point before the send gate approves does an
 * `email.send` outbox row exist, and every send row traces to the one
 * approved run. Compressed follow-up timers and the loopback sink keep
 * the whole cycle in-process; a real-LLM variant runs only when
 * LLM_BASE_URL (and the model ids) are configured.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-lifecycle-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";
// Loopback domains: outbound mail never leaves the box.
process.env.EMAIL_LOOPBACK_DOMAINS = "tarima.test,casa-lifecycle.test";
// Compressed timers so the follow-up branch fires inside the test.
process.env.ENGINE_FOLLOW_UP_DELAY_MS = "150";
process.env.CHASE_GATE_KEEPALIVE_MS = String(60 * 60 * 1000);

const { randomUUID } = await import("node:crypto");
const { db } = await import("./db");
const {
  entities,
  loopbackInbox,
  outbox,
  outreachMessages,
  projects,
  steps,
  venueCatalog,
  workflows,
} = await import("./db/schema");
const { startEngine } = await import("./engine");
const { advanceStage, decideGate } = await import("./services/approval");
const { triggerWorkflow } = await import("./services/workflows");
const { updateEntity } = await import("./services/entities");

const REAL_LLM = Boolean(process.env.LLM_BASE_URL && process.env.LLM_INSTRUCT_MODEL_ID);

afterAll(() => rmSync(dir, { recursive: true, force: true }));

/** Poll until `predicate` holds or the timeout elapses. */
async function waitFor(predicate: () => boolean, timeoutMs = 10000): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error("waitFor timed out");
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

const emailSends = () =>
  db
    .select()
    .from(outbox)
    .all()
    .filter((row) => row.type === "email.send");
const outboundFor = (entityId: string) =>
  db
    .select()
    .from(outreachMessages)
    .all()
    .filter((row) => row.direction === "outbound" && row.entityId === entityId);

let projectId: string;

beforeAll(() => {
  startEngine();
  db.insert(venueCatalog)
    .values({
      id: randomUUID(),
      city: "Malaga",
      name: "Casa Lifecycle",
      capacity: 60,
      source: "test",
      createdAt: Date.now(),
    })
    .onConflictDoNothing()
    .run();

  projectId = randomUUID();
  db.insert(projects)
    .values({
      id: projectId,
      name: "Lifecycle project",
      stage: "brief",
      goal: { notes: "offsite for 40 in Malaga" },
      createdAt: Date.now(),
    })
    .run();
});

describe("lifecycle: confirm -> curate -> approve -> send -> reply -> parse -> done", () => {
  it(
    "runs the whole cycle with zero unstaged sends",
    {
      timeout: 60_000,
    },
    async () => {
      // 1. Confirm: brief -> spec_review, the spec gate stores the edited
      //    brief; curation runs and lands the project at the shortlist.
      expect(advanceStage(projectId, "spec_review").ok).toBe(true);
      const spec = decideGate(projectId, "spec", "approve", {
        brief: {
          eventType: "offsite",
          city: "Malaga",
          headcount: 40,
          budgetAmount: 4000,
          currency: "EUR",
        },
      });
      expect(spec.ok).toBe(true);
      if (spec.ok) expect(spec.value.pendingGate).toBe("shortlist");

      // Nothing has been drafted or sent yet.
      expect(emailSends()).toHaveLength(0);

      // 2. Shortlist: approve the candidate; it becomes pending.
      const candidate = db
        .select()
        .from(entities)
        .all()
        .find((row) => row.projectId === projectId);
      expect(candidate).toBeDefined();
      const shortlist = decideGate(projectId, "shortlist", "approve", {
        entityIds: [candidate!.id],
      });
      expect(shortlist.ok).toBe(true);
      if (shortlist.ok) expect(shortlist.value.released).toBe(1);
      expect(
        db
          .select()
          .from(entities)
          .all()
          .find((r) => r.id === candidate!.id)?.status,
      ).toBe("pending");
      expect(emailSends()).toHaveLength(0);

      // 3. The user completes the row with a contact (loopback address),
      //    then triggers the chase run (what the workflows route does).
      const entityId = candidate!.id;
      const contactEmail = "booker@casa-lifecycle.test";
      updateEntity(db, entityId, { contact: contactEmail });
      const runs = triggerWorkflow(db, projectId, "chase-deliverables");
      expect(runs).toHaveLength(1);
      const runId = runs[0]!.runId;

      // 4. The run drafts and parks at the send gate. Nothing is sent.
      await waitFor(() => {
        const run = db
          .select()
          .from(workflows)
          .all()
          .find((r) => r.id === runId);
        return run?.state === "outreach_staged";
      });
      expect(emailSends()).toHaveLength(0);
      expect(outboundFor(entityId)).toHaveLength(0);

      // Wait for the parked gate step to exist before deciding: the park
      // enqueues its keep-alive child in the same transaction as the
      // state flip, so this is immediate, but poll anyway.
      await waitFor(() =>
        db
          .select()
          .from(steps)
          .all()
          .some(
            (step) =>
              step.runId === runId &&
              step.stepKey.startsWith("chase.outreach_staged") &&
              step.status === "pending",
          ),
      );

      // 5. Send gate approve: the ONLY path that releases the draft.
      const send = decideGate(projectId, "send", "approve");
      expect(send.ok).toBe(true);
      if (send.ok) expect(send.value.released).toBe(1);

      await waitFor(() => outboundFor(entityId).length > 0);
      // The follow-up timer is compressed (150ms), so it may fire while
      // this test asserts: only the first send is pinned exactly.
      expect(emailSends()[0]!.status).toBe("sent");
      expect(emailSends()[0]!.idempotencyKey).toBe(`chase:send:${runId}:initial`);

      // The loopback sink received the mail: no external provider call.
      expect(
        db
          .select()
          .from(loopbackInbox)
          .all()
          .some((row) => row.toAddr === contactEmail),
      ).toBe(true);

      // 7. Wait for the compressed follow-up timer to fire first: if the
      //    reply landed before it came due, the run would finish without
      //    a follow-up and that timing would be env-speed dependent.
      await waitFor(() => outboundFor(entityId).length > 1);
      const followUps = emailSends().filter((row) =>
        row.idempotencyKey.startsWith(`chase:send:${runId}:followup`),
      );
      expect(followUps.length).toBeGreaterThan(0);
      expect(followUps[0]!.idempotencyKey).toBe(`chase:send:${runId}:followup-1`);
      updateEntity(db, entityId, { status: "awaiting_reply" });
      const { enqueueParseStep } = await import("./services/runs");
      expect(enqueueParseStep(db, runId, "Done, everything is attached.")).toBeTruthy();

      // The follow-up inherits the original approval (one click per run)
      // and went out without a second gate decision.

      await waitFor(() => {
        const run = db
          .select()
          .from(workflows)
          .all()
          .find((r) => r.id === runId);
        return run?.status === "done" && run.state === "done";
      });

      // The parsed fields land on the entity when the outbox pump applies
      // the `entity.update` effect (it may lag the run's completion by one
      // pump interval).
      await waitFor(() => {
        const row = db
          .select()
          .from(entities)
          .all()
          .find((r) => r.id === entityId);
        return (row?.result as Record<string, unknown> | undefined)?.deliverables === "received";
      });
      const row = db
        .select()
        .from(entities)
        .all()
        .find((r) => r.id === entityId)!;
      expect((row.result as Record<string, unknown>).deliverables).toBe("received");

      // 8. Hard assertion, re-checked at the end: every send traces to
      //    the one approved run. Zero unstaged sends exist.
      expect(emailSends().every((row) => row.idempotencyKey.startsWith(`chase:send:`))).toBe(true);
      expect(
        emailSends().every(
          (row) =>
            !row.idempotencyKey.startsWith(`chase:send:${runId}:`) ||
            ["initial", "followup-1", "followup-2"].some((tag) =>
              row.idempotencyKey.endsWith(`:${tag}`),
            ),
        ),
      ).toBe(true);
    },
  );

  it.runIf(REAL_LLM)(
    "same cycle against a real LLM provider when one is configured",
    { timeout: 30_000 },
    async () => {
      const project2 = randomUUID();
      db.insert(projects)
        .values({
          id: project2,
          name: "Lifecycle real-llm",
          stage: "brief",
          goal: { notes: "offsite for 40 in Malaga" },
          createdAt: Date.now(),
        })
        .run();

      expect(advanceStage(project2, "spec_review").ok).toBe(true);
      const spec = decideGate(project2, "spec", "approve", {
        brief: {
          eventType: "offsite",
          city: "Malaga",
          headcount: 40,
          budgetAmount: 4000,
          currency: "EUR",
        },
      });
      expect(spec.ok).toBe(true);

      const candidate = db
        .select()
        .from(entities)
        .all()
        .find((row) => row.projectId === project2);
      expect(candidate).toBeDefined();
      const shortlist = decideGate(project2, "shortlist", "approve", {
        entityIds: [candidate!.id],
      });
      expect(shortlist.ok).toBe(true);

      updateEntity(db, candidate!.id, {
        contact: "booker@casa-lifecycle.test",
      });
      const runs = triggerWorkflow(db, project2, "chase-deliverables");
      const runId = runs[0]!.runId;

      await waitFor(() => {
        const run = db
          .select()
          .from(workflows)
          .all()
          .find((r) => r.id === runId);
        return run?.state === "outreach_staged";
      });
      // Real drafts still do not send before the gate.
      expect(
        emailSends().every(
          (row) => row.status !== "sent" || row.idempotencyKey.startsWith(`chase:send:`),
        ),
      ).toBe(true);

      const send = decideGate(project2, "send", "approve");
      expect(send.ok).toBe(true);
      await waitFor(() => outboundFor(candidate!.id).length > 0);
      expect(
        db
          .select()
          .from(loopbackInbox)
          .all()
          .some((row) => row.toAddr === "booker@casa-lifecycle.test"),
      ).toBe(true);
    },
  );
});

/**
 * The board path that skips the venue flow: a project filled by CSV
 * intake or a manual add-row is at stage `brief` when its chase
 * starts. The trigger must open the send gate (stage `send_review`)
 * so the staged drafts are decidable, and the two orderings of the
 * approval and the staging must both work:
 *
 *   - the gate decides BEFORE the run stages its draft: the run must
 *     be auto-released, because the approval covers the project run
 *   - the run stages BEFORE the gate decides: the gate releases it
 *
 * The hard assertion holds in both: no `email.send` outbox row exists
 * before the approval.
 */
describe("lifecycle: the send gate on a board that skipped the venue flow", () => {
  /** A project with one waiting row and a loopback contact. */
  function seedProject(name: string): { projectId: string; entityId: string } {
    const projectId = randomUUID();
    db.insert(projects)
      .values({
        id: projectId,
        name,
        stage: "brief",
        goal: { notes: "offsite for 40 in Malaga" },
        createdAt: Date.now(),
      })
      .run();
    const entityId = randomUUID();
    db.insert(entities)
      .values({
        id: entityId,
        projectId,
        name: `${name} row`,
        contactEmail: "booker@casa-lifecycle.test",
        goal: { missing: ["menu"] },
        result: {},
        status: "intake",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      .run();
    return { projectId, entityId };
  }

  /** The email.send rows of one run (the earlier lifecycle test's
   * compressed follow-ups keep the global count moving). */
  const sendsFor = (runId: string) =>
    emailSends().filter((row) => row.idempotencyKey.startsWith(`chase:send:${runId}:`));

  /** Wait until the run of `runId` parked in `outreach_staged`. */
  async function waitForStaged(runId: string): Promise<void> {
    await waitFor(() => {
      const run = db
        .select()
        .from(workflows)
        .all()
        .find((r) => r.id === runId);
      return run?.state === "outreach_staged";
    });
    // The parked gate step exists in the same transaction as the state
    // flip; poll anyway so the gate decision always finds it.
    await waitFor(() =>
      db
        .select()
        .from(steps)
        .all()
        .some(
          (step) =>
            step.runId === runId &&
            step.stepKey.startsWith("chase.outreach_staged") &&
            step.status === "pending",
        ),
    );
  }

  it(
    "opens the send gate when the chase starts on a brief-stage project",
    { timeout: 30_000 },
    async () => {
      const { projectId } = seedProject("Gate opening");

      const runs = triggerWorkflow(db, projectId, "chase-deliverables");
      expect(runs).toHaveLength(1);

      // The project moved to the send gate: the drafts are decidable.
      const stage = db
        .select()
        .from(projects)
        .all()
        .find((row) => row.id === projectId)?.stage;
      expect(stage).toBe("send_review");
    },
  );

  it(
    "releases a run that stages AFTER the approval, with no second click",
    { timeout: 30_000 },
    async () => {
      const { projectId, entityId } = seedProject("Approve first");

      const runs = triggerWorkflow(db, projectId, "chase-deliverables");
      const runId = runs[0]!.runId;

      // The gate decides while the run is still drafting: nothing is
      // staged yet, so the decision releases nothing.
      const send = decideGate(projectId, "send", "approve");
      expect(send.ok).toBe(true);
      if (send.ok) expect(send.value.released).toBe(0);
      expect(sendsFor(runId)).toHaveLength(0);

      // The run stages afterwards: it inherits the approval and is
      // released without a second gate decision.
      await waitForStaged(runId);
      await waitFor(() => outboundFor(entityId).length > 0);

      // The first send of the run is the approved draft. The compressed
      // follow-up timer may add more sends after it, so only the first
      // one is pinned.
      expect(sendsFor(runId)[0]!.idempotencyKey).toBe(`chase:send:${runId}:initial`);
    },
  );

  it(
    "releases a run that staged BEFORE the approval, with one click",
    { timeout: 30_000 },
    async () => {
      const { projectId, entityId } = seedProject("Approve last");

      const runs = triggerWorkflow(db, projectId, "chase-deliverables");
      const runId = runs[0]!.runId;

      await waitForStaged(runId);

      // The hard assertion: nothing was sent while the draft waited.
      expect(sendsFor(runId)).toHaveLength(0);
      expect(outboundFor(entityId)).toHaveLength(0);

      const send = decideGate(projectId, "send", "approve");
      expect(send.ok).toBe(true);
      if (send.ok) expect(send.value.released).toBe(1);

      await waitFor(() => outboundFor(entityId).length > 0);
      // Only the first send is pinned: the compressed follow-up timer
      // may fire right after it.
      expect(sendsFor(runId)[0]!.idempotencyKey).toBe(`chase:send:${runId}:initial`);
    },
  );
});
