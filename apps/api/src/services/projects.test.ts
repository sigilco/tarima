import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// The database url must be set BEFORE the db module is imported: the
// api opens the sqlite file at import time.
const dir = mkdtempSync(join(tmpdir(), "tarima-projects-svc-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { users } = await import("../db/schema");
const { createProject, getProject, listProjects, updateProject, isValidGoal } =
  await import("./projects");

const ALICE = "user-alice";
const BOB = "user-bob";

afterAll(() => rmSync(dir, { recursive: true, force: true }));

beforeAll(() => {
  for (const [id, email] of [
    [ALICE, "alice@tarima.test"],
    [BOB, "bob@tarima.test"],
  ] as const) {
    db.insert(users).values({ id, email, createdAt: Date.now() }).onConflictDoNothing().run();
  }
});

const BRIEF = {
  eventType: "founder dinner",
  city: "Paris",
  headcount: 25,
  budgetAmount: 3500,
  currency: "EUR",
};

describe("project service: owner scoping", () => {
  it("lists only the caller's projects when an owner is given", () => {
    const mine = createProject(db, { name: "alice board", ownerId: ALICE });
    createProject(db, { name: "bob board", ownerId: BOB });

    const aliceList = listProjects(db, ALICE);
    expect(aliceList.map((p) => p.id)).toContain(mine.id);
    expect(aliceList.every((p) => p.name !== "bob board")).toBe(true);

    // No owner (the machine surface) still sees everything.
    expect(listProjects(db).map((p) => p.id)).toContain(mine.id);
  });

  it("reads another owner's project as unknown", () => {
    const mine = createProject(db, { name: "secret board", ownerId: ALICE });

    expect(getProject(db, mine.id, ALICE)?.id).toBe(mine.id);
    expect(getProject(db, mine.id, BOB)).toBeUndefined();
    // An ownerless row (legacy) is invisible to a scoped read too.
    const legacy = createProject(db, { name: "legacy board" });
    expect(getProject(db, legacy.id, ALICE)).toBeUndefined();
  });

  it("patches are not blocked by scoping at the service level", () => {
    const mine = createProject(db, { name: "before", ownerId: ALICE });
    const patched = updateProject(db, mine.id, { name: "after" });
    expect(patched?.name).toBe("after");
  });
});

describe("project service: brief validation", () => {
  it("accepts a valid brief in the goal and stores it under the key", () => {
    const project = createProject(db, {
      name: "with brief",
      goal: { brief: BRIEF },
    });
    expect(project.goal.brief).toEqual(BRIEF);
  });

  it("accepts a goal with no brief at all", () => {
    createProject(db, { name: "no brief", goal: { other: 1 } });
    expect(isValidGoal({ other: 1 })).toBe(true);
    expect(isValidGoal(undefined)).toBe(true);
  });

  it("rejects a malformed brief", () => {
    expect(isValidGoal({ brief: { eventType: "dinner" } })).toBe(false);
    expect(() => createProject(db, { name: "bad", goal: { brief: { nope: true } } })).toThrow();
  });
});
