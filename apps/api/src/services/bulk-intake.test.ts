import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-bulk-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { entities, events, projects } = await import("../db/schema");
const { handleBulkIntake } = await import("./bulk-intake");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const PROJECT_ID = "66666666-6666-4666-8666-666666666666";

beforeAll(() => {
  db.insert(projects)
    .values({ id: PROJECT_ID, name: "Bulk Project", createdAt: Date.now(), updatedAt: Date.now() })
    .run();
});

describe("handleBulkIntake", () => {
  it("creates the rows and reports them on the wire shape", async () => {
    const result = await handleBulkIntake(
      PROJECT_ID,
      "name,contact,missing\nAcme,ops@acme.test,logo;deck\nBeta,,\n",
      "tester",
    );

    expect(result.fatal).toBe(false);
    expect(result.created).toBe(2);
    expect(result.errors).toEqual([]);
    expect(result.entities[0]).toMatchObject({
      projectId: PROJECT_ID,
      name: "Acme",
      contact: "ops@acme.test",
      status: "intake",
      missing: ["logo", "deck"],
    });
    expect(result.entities[1]?.contact).toBeUndefined();

    const rows = db.select().from(entities).all();
    expect(rows).toHaveLength(2);
  });

  it("keeps the good rows and reports the bad ones", async () => {
    const result = await handleBulkIntake(
      PROJECT_ID,
      "name,contact\nGood,g@x.co\n,missing@x.co\n",
      "tester",
    );

    expect(result.fatal).toBe(false);
    expect(result.created).toBe(1);
    expect(result.errors).toEqual([{ row: 3, message: "name is required" }]);
  });

  it("reports a document that is not a csv of entities at all", async () => {
    const result = await handleBulkIntake(PROJECT_ID, "contact\na@b.co\n", "tester");

    expect(result.fatal).toBe(true);
    expect(result.created).toBe(0);
    expect(result.errors[0]?.message).toContain('missing required column "name"');
  });

  it("writes an audit event for the intake", async () => {
    await handleBulkIntake(PROJECT_ID, "name\nAudited Row\n", "tester");

    const audit = db.select().from(events).all();
    const intake = audit.find((e) => e.type === "entities.bulk_intake");
    expect(intake?.subjectId).toBe(PROJECT_ID);
    expect(intake?.actor).toBe("tester");
  });
});
