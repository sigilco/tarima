/**
 * Engine boot integration test (Stage 4, T4.3).
 *
 * Drives a chase-deliverables run through the real api engine wiring
 * (chase handlers + outbox dispatch) against the loopback transport:
 *
 *   - intake -> outreach sends the email (loopback inbox + an outbound
 *     `outreach_messages` row)
 *   - the run then WAITS in `await_reply` (the api wrapper parks it
 *     instead of auto-parsing a placeholder), so the webhook can still
 *     attach a real reply
 *   - a reply enqueued the way the webhook does it drives
 *     parse -> validate -> update -> notify, and the entity's result
 *     bag fills from the parsed fields
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-engine-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";
// Loopback domains so outbound mail never leaves the box.
process.env.EMAIL_LOOPBACK_DOMAINS = "tarima.test,bluenote.test";
// A short follow-up timer keeps the parked step from being due during
// the test (it would send a real follow-up email).
process.env.ENGINE_FOLLOW_UP_DELAY_MS = String(60 * 60 * 1000);

const { randomUUID } = await import("node:crypto");
const { db } = await import("./db");
const { entities, loopbackInbox, outbox, outreachMessages, projects, steps, workflows } =
  await import("./db/schema");
const { startEngine } = await import("./engine");
const { enqueueStep } = await import("@tarima/engine/journal");
const { enqueueParseStep } = await import("./services/runs");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

/** Poll until `predicate` holds or the timeout elapses. */
async function waitFor(predicate: () => boolean, timeoutMs = 5000): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) throw new Error("waitFor timed out");
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

let entityId: string;
let runId: string;

beforeAll(() => {
  const projectId = randomUUID();
  db.insert(projects)
    .values({ id: projectId, name: "Engine project", createdAt: Date.now() })
    .run();

  entityId = randomUUID();
  db.insert(entities)
    .values({
      id: entityId,
      projectId,
      name: "Blue Note",
      contactEmail: "booker@bluenote.test",
      createdAt: Date.now(),
    })
    .run();

  runId = randomUUID();
  db.insert(workflows)
    .values({
      id: runId,
      type: "chase-deliverables",
      status: "running",
      state: "intake",
      context: {
        entityId,
        entityName: "Blue Note",
        contactEmail: "booker@bluenote.test",
        goal: {},
      },
      createdAt: Date.now(),
    })
    .run();
});

describe("engine boot", () => {
  it("is idempotent", () => {
    const first = startEngine();
    const second = startEngine();
    expect(second).toBe(first);
  });

  it("sends the outreach email through the outbox and records it", async () => {
    // The service layer triggers runs the same way; here the seed run
    // is reused by enqueueing its intake step directly.
    enqueueStep(db, runId, "chase.intake", {
      entityId,
      entityName: "Blue Note",
      to: "booker@bluenote.test",
      goal: {},
    });

    await waitFor(() => {
      const rows = db
        .select()
        .from(outreachMessages)
        .all()
        .filter((row) => row.direction === "outbound" && row.entityId === entityId);
      return rows.length > 0;
    });

    const sent = db
      .select()
      .from(outreachMessages)
      .all()
      .filter((row) => row.direction === "outbound" && row.entityId === entityId);
    expect(sent.length).toBe(1);
    expect(sent[0]!.subject).toContain("Blue Note");
    expect(sent[0]!.sentAt).toBeTruthy();

    // The send itself went through the loopback transport.
    const inbox = db.select().from(loopbackInbox).all();
    expect(inbox.some((row) => row.toAddr === "booker@bluenote.test")).toBe(true);

    // The outbox row is marked sent exactly once (idempotent key).
    const emailRows = db
      .select()
      .from(outbox)
      .all()
      .filter((row) => row.type === "email.send");
    expect(emailRows.length).toBe(1);
    expect(emailRows[0]!.status).toBe("sent");
  });

  it("parks the run in await_reply until a reply arrives", async () => {
    await waitFor(() => {
      const run = db
        .select()
        .from(workflows)
        .all()
        .find((row) => row.id === runId);
      return run?.state === "await_reply";
    });

    const run = db
      .select()
      .from(workflows)
      .all()
      .find((row) => row.id === runId)!;
    expect(run.status).toBe("running");
    expect((run.context as Record<string, unknown>).followUps).toBeUndefined();

    // The follow-up timer step is queued but not due for an hour.
    const pending = db
      .select()
      .from(steps)
      .all()
      .filter((step) => step.runId === runId && step.status === "pending");
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every((step) => step.runAt > Date.now())).toBe(true);
  });

  it("applies the entity.update effect to the entity result bag", async () => {
    // A reply, enqueued exactly the way the webhook route does it.
    enqueueParseStep(db, runId, "Done, everything is attached.");

    await waitFor(() => {
      const row = db
        .select()
        .from(entities)
        .all()
        .find((e) => e.id === entityId);
      return (row?.result as Record<string, unknown> | undefined)?.deliverables !== undefined;
    });

    const row = db
      .select()
      .from(entities)
      .all()
      .find((e) => e.id === entityId)!;
    expect(row.status).toBe("updated");
    expect((row.result as Record<string, unknown>).deliverables).toBe("received");
  });

  it("completes the run after the notify step", async () => {
    await waitFor(() => {
      const run = db
        .select()
        .from(workflows)
        .all()
        .find((row) => row.id === runId);
      return run?.status === "done" && run?.state === "done";
    });

    const run = db
      .select()
      .from(workflows)
      .all()
      .find((row) => row.id === runId)!;
    expect(run.status).toBe("done");
  });
});
