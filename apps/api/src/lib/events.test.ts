import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-events-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { entities, events, projects } = await import("../db/schema");
const { eq } = await import("drizzle-orm");
const { advanceCursor, cursorNow, listProjectEvents, pollBoardEvents } = await import("./events");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_PROJECT_ID = "22222222-2222-4222-8222-222222222222";
const ENTITY_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_ENTITY_ID = "44444444-4444-4444-8444-444444444444";

const now = Date.now();

db.insert(projects)
  .values([
    { id: PROJECT_ID, name: "events project", createdAt: now, updatedAt: now },
    { id: OTHER_PROJECT_ID, name: "other project", createdAt: now, updatedAt: now },
  ])
  .run();

db.insert(entities)
  .values([
    {
      id: ENTITY_ID,
      projectId: PROJECT_ID,
      name: "Acme",
      goal: { missing: ["logo"] },
      status: "intake",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: OTHER_ENTITY_ID,
      projectId: OTHER_PROJECT_ID,
      name: "Beta",
      goal: {},
      status: "intake",
      createdAt: now,
      updatedAt: now,
    },
  ])
  .run();

function writeEvent(
  subjectType: string,
  subjectId: string,
  createdAt: number,
  type = "test.event",
) {
  const id = randomUUID();
  db.insert(events)
    .values({ id, actor: "test", type, subjectType, subjectId, data: { n: 1 }, createdAt })
    .run();
  return id;
}

describe("listProjectEvents", () => {
  it("returns only the project scope, oldest first", () => {
    writeEvent("project", PROJECT_ID, 1000, "a");
    writeEvent("entity", ENTITY_ID, 2000, "b");
    writeEvent("entity", OTHER_ENTITY_ID, 1500, "c");
    writeEvent("project", OTHER_PROJECT_ID, 1200, "d");

    const rows = listProjectEvents(db, PROJECT_ID, [ENTITY_ID], { since: 0, seen: new Set() });

    expect(rows.map((r) => r.type)).toEqual(["a", "b"]);
    expect(rows[0]?.data).toEqual({ n: 1 });
  });

  it("skips the rows already delivered at the boundary millisecond", () => {
    const id = writeEvent("project", PROJECT_ID, 5000, "same-ms");
    const cursor = { since: 5000, seen: new Set([id]) };

    expect(listProjectEvents(db, PROJECT_ID, [], cursor)).toEqual([]);

    const second = writeEvent("project", PROJECT_ID, 5000, "same-ms-2");
    const rows = listProjectEvents(db, PROJECT_ID, [], cursor);
    expect(rows.map((r) => r.id)).toEqual([second]);
  });

  it("advanceCursor keeps the newest timestamp and only the ids at it", () => {
    const cursor = advanceCursor({ since: 0, seen: new Set() }, [
      {
        id: "a",
        type: "t",
        subjectType: "project",
        subjectId: PROJECT_ID,
        data: {},
        createdAt: 10,
      },
      {
        id: "b",
        type: "t",
        subjectType: "project",
        subjectId: PROJECT_ID,
        data: {},
        createdAt: 20,
      },
      {
        id: "c",
        type: "t",
        subjectType: "project",
        subjectId: PROJECT_ID,
        data: {},
        createdAt: 20,
      },
    ]);

    expect(cursor.since).toBe(20);
    expect([...cursor.seen]).toEqual(["b", "c"]);
  });
});

describe("pollBoardEvents", () => {
  it("emits a synthetic entity.changed signal for a row that moved", () => {
    const cursor = cursorNow();
    const moved = now + 5_000;
    db.update(entities)
      .set({ updatedAt: moved, status: "chasing" })
      .where(eq(entities.id, ENTITY_ID))
      .run();

    const rows = pollBoardEvents(db, PROJECT_ID, cursor);

    const changed = rows.find((r) => r.type === "entity.changed");
    expect(changed?.subjectId).toBe(ENTITY_ID);
    expect(changed?.id).toBe(`entity.changed:${ENTITY_ID}:${moved}`);
  });

  it("does not repeat a signal it already delivered", () => {
    const cursor = cursorNow();
    const moved = now + 6_000;
    db.update(entities).set({ updatedAt: moved }).where(eq(entities.id, ENTITY_ID)).run();

    const first = pollBoardEvents(db, PROJECT_ID, cursor);
    const next = advanceCursor(cursor, first);
    const second = pollBoardEvents(db, PROJECT_ID, next);

    expect(first.some((r) => r.type === "entity.changed")).toBe(true);
    expect(second.some((r) => r.type === "entity.changed")).toBe(false);
  });
});
