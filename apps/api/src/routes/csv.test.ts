import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "tarima-csv-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { csvRoutes } = await import("./csv");
const { db } = await import("../db");
const { projects } = await import("../db/schema");

const json = (body: unknown) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

let projectId: string;

beforeAll(() => {
  const row = {
    id: randomUUID(),
    ownerId: null,
    name: "CSV Intake Project",
    description: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  db.insert(projects).values(row).run();
  projectId = row.id;
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("POST /api/projects/:projectId/entities/bulk", () => {
  it("creates entities from a csv and maps them to the wire shape", async () => {
    const res = await csvRoutes.request(
      `/api/projects/${projectId}/entities/bulk`,
      json({ csv: "name,contact,missing\nAcme,a@b.co,logo;deck\nBeta,,\n" }),
    );
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      created: number;
      entities: Array<{ name: string; contact?: string; status: string; missing: string[] }>;
      errors: unknown[];
    };
    expect(data.created).toBe(2);
    expect(data.errors).toEqual([]);
    expect(data.entities).toHaveLength(2);

    const acme = data.entities.find((e) => e.name === "Acme");
    expect(acme?.contact).toBe("a@b.co");
    expect(acme?.status).toBe("intake");
    expect(acme?.missing).toEqual(["logo", "deck"]);

    const beta = data.entities.find((e) => e.name === "Beta");
    expect(beta?.contact).toBeUndefined();
    expect(beta?.missing).toEqual([]);
  });

  it("answers 200 with per-row errors when only some rows fail", async () => {
    const res = await csvRoutes.request(
      `/api/projects/${projectId}/entities/bulk`,
      json({ csv: "name,contact\nGood,g@b.co\n,bad@b.co\nBadEmail,not-an-email\n" }),
    );
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      created: number;
      entities: Array<{ name: string }>;
      errors: Array<{ row: number; message: string }>;
    };
    expect(data.created).toBe(1);
    expect(data.entities[0]?.name).toBe("Good");
    expect(data.errors).toHaveLength(2);
    expect(data.errors[0]).toEqual({ row: 3, message: "name is required" });
    expect(data.errors[1]?.row).toBe(4);
  });

  it("answers 400 when the csv is empty or has no name column", async () => {
    const empty = await csvRoutes.request(
      `/api/projects/${projectId}/entities/bulk`,
      json({ csv: "" }),
    );
    expect(empty.status).toBe(400);

    const noName = await csvRoutes.request(
      `/api/projects/${projectId}/entities/bulk`,
      json({ csv: "contact\na@b.co\n" }),
    );
    expect(noName.status).toBe(400);
  });

  it("answers 400 for a malformed body", async () => {
    const missing = await csvRoutes.request(`/api/projects/${projectId}/entities/bulk`, json({}));
    expect(missing.status).toBe(400);

    const notJson = await csvRoutes.request(`/api/projects/${projectId}/entities/bulk`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    });
    expect(notJson.status).toBe(400);
  });

  it("answers 404 when the project does not exist", async () => {
    const res = await csvRoutes.request(
      "/api/projects/00000000-0000-4000-8000-000000000000/entities/bulk",
      json({ csv: "name\nA\n" }),
    );
    expect(res.status).toBe(404);
  });
});
