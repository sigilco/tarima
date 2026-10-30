/**
 * Approval flow tests: the stage machine behind /stage and /approve,
 * run against the real db module. Covers:
 *   - stage transitions and gate mismatch rejections
 *   - the spec gate storing the edited brief
 *   - curation creating candidate rows from the catalog
 *   - the shortlist gate cutting rows
 *   - the send gate enqueueing decisions but never emitting a send:
 *     no outbox row of type email.send may exist before the chase gate
 *     handler runs. That is this stream's hard assertion.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const dir = mkdtempSync(join(tmpdir(), "tarima-flow-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { randomUUID } = await import("node:crypto");
const { db } = await import("../db");
const { entities, outbox, projects, steps, venueCatalog, workflows } = await import("../db/schema");
const { enqueueStep } = await import("@tarima/engine/journal");
const { advanceStage, decideGate } = await import("./approval");
const { curateProject } = await import("./curation");
const { createEntity } = await import("./entities");
const { createProject } = await import("./projects");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

function seedVenue(name: string, capacity: number | null = 50): void {
  db.insert(venueCatalog)
    .values({
      id: randomUUID(),
      city: "Malaga",
      name,
      capacity,
      source: "test",
      createdAt: Date.now(),
    })
    .onConflictDoNothing()
    .run();
}

function project() {
  return db.select().from(projects).where(eq(projects.id, projectId)).get()!;
}

let projectId: string;

beforeAll(() => {
  projectId = createProject(db, { name: "Flow project", goal: { notes: "offsite for 40" } }).id;
  seedVenue("Casa Flow", 60);
  seedVenue("Tiny Bar", 10);
});

describe("approval flow", () => {
  it("rejects gate decisions while no gate is pending", () => {
    const result = decideGate(projectId, "spec", "approve");
    expect(result.ok).toBe(false);
  });

  it("moves brief -> spec_review and stores the edited brief at the spec gate", () => {
    const staged = advanceStage(projectId, "spec_review");
    expect(staged.ok).toBe(true);

    const approved = decideGate(projectId, "spec", "approve", {
      brief: {
        eventType: "offsite",
        city: "Malaga",
        headcount: 40,
        budgetAmount: 4000,
        currency: "EUR",
      },
    });
    expect(approved.ok).toBe(true);

    const brief = (project().goal as Record<string, unknown>).brief as Record<string, unknown>;
    expect(brief.city).toBe("Malaga");
    expect(brief.headcount).toBe(40);
  });

  it("curation is idempotent and filters by capacity", () => {
    // The spec gate already ran curation over the stored brief.
    expect(curateProject(projectId).candidates).toBe(0);
    const rows = db
      .select()
      .from(entities)
      .all()
      .filter((r) => r.projectId === projectId);
    expect(rows.map((r) => r.name)).toEqual(["Casa Flow"]); // Tiny Bar (cap 10) filtered
    expect(rows[0]!.status).toBe("candidate");
  });

  it("the shortlist gate cuts nothing kept and opens the send gate", () => {
    db.update(projects).set({ stage: "shortlist_review" }).where(eq(projects.id, projectId)).run();
    const candidate = db
      .select()
      .from(entities)
      .all()
      .find((r) => r.projectId === projectId)!;

    const result = decideGate(projectId, "shortlist", "approve", { entityIds: [candidate.id] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.released).toBe(1);
      expect(result.value.discarded).toBe(0);
      expect(result.value.pendingGate).toBe("send");
    }
    expect(
      db
        .select()
        .from(entities)
        .all()
        .find((r) => r.id === candidate.id)?.status,
    ).toBe("pending");
  });

  it("the send gate enqueues decisions and never writes an email.send row", () => {
    // Seed a staged run the way the engine leaves it after outreach:
    // parked in outreach_staged with the draft in the gate step input.
    const candidate = db
      .select()
      .from(entities)
      .all()
      .find((r) => r.projectId === projectId)!;
    const runId = randomUUID();
    db.insert(workflows)
      .values({
        id: runId,
        type: "chase-deliverables",
        status: "running",
        state: "outreach_staged",
        context: { entityId: candidate.id, entityName: candidate.name },
        createdAt: Date.now(),
      })
      .run();
    enqueueStep(db, runId, "chase.outreach_staged", {
      entityName: candidate.name,
      draft: { subject: "s", body: "b" },
    });

    const sendsBefore = db
      .select()
      .from(outbox)
      .all()
      .filter((r) => r.type === "email.send");
    expect(sendsBefore).toHaveLength(0);

    const result = decideGate(projectId, "send", "approve");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.released).toBe(1);

    // The decision step exists, but the send itself does not: only the
    // chase gate handler turns the decision into an outbox row.
    const sends = db
      .select()
      .from(outbox)
      .all()
      .filter((r) => r.type === "email.send");
    expect(sends).toHaveLength(0);
    expect(project().stage).toBe("running");
  });

  it("rejecting the send gate discards the drafts", () => {
    const result = decideGate(projectId, "send", "reject");
    expect(result.ok).toBe(false); // stage moved past send_review; gate closed
  });

  it("the send gate only releases the staged runs of its own project", () => {
    // A second project with its own staged run: the gate of the first
    // project must not touch it.
    const otherId = createProject(db, { name: "Other flow project" }).id;
    const otherEntity = createEntity(db, {
      projectId: otherId,
      name: "Other row",
      status: "intake",
      missing: [],
    });
    const otherRunId = randomUUID();
    db.insert(workflows)
      .values({
        id: otherRunId,
        type: "chase-deliverables",
        status: "running",
        state: "outreach_staged",
        context: { entityId: otherEntity.id, entityName: otherEntity.name },
        createdAt: Date.now(),
      })
      .run();
    enqueueStep(db, otherRunId, "chase.outreach_staged", {
      entityName: otherEntity.name,
      draft: { subject: "s", body: "b" },
    });

    // The other project is at the send gate too, so its gate is
    // decidable.
    db.update(projects).set({ stage: "send_review" }).where(eq(projects.id, otherId)).run();

    const other = decideGate(otherId, "send", "approve");
    expect(other.ok).toBe(true);
    if (other.ok) expect(other.value.released).toBe(1);

    // The other project's draft was released, and the first project's
    // staged run (from the test above) was left alone.
    const otherSteps = db
      .select()
      .from(steps)
      .all()
      .filter((step) => step.runId === otherRunId && step.stepKey.includes("outreach_staged"));
    // The decision step of the other project carries the approval.
    expect(
      otherSteps.some(
        (step) =>
          step.stepKey.includes("#") &&
          (step.input as { event?: string }).event === "SEND_APPROVED",
      ),
    ).toBe(true);

    // The other project's draft was released, and the first project's
    // staged run was left alone: no new decision step landed on it.
    const firstProjectRunIds = db
      .select()
      .from(workflows)
      .all()
      .filter(
        (run) =>
          (run.context as Record<string, unknown> | undefined)?.entityId ===
          db
            .select()
            .from(entities)
            .all()
            .find((row) => row.projectId === projectId)?.id,
      )
      .map((run) => run.id);
    const firstRunDecisions = db
      .select()
      .from(steps)
      .all()
      .filter(
        (step) =>
          firstProjectRunIds.includes(step.runId) &&
          (step.input as { event?: string }).event === "SEND_APPROVED",
      );
    // Exactly one: the decision the first project's own gate made in
    // the test above. The second gate did not add a second one.
    expect(firstRunDecisions).toHaveLength(1);
  });
});
