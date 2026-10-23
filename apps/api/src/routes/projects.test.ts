import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// The database url must be set BEFORE the db module is imported: the
// api opens the sqlite file at import time.
const dir = mkdtempSync(join(tmpdir(), "tarima-projects-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { Hono } = await import("hono");
const { db } = await import("../db");
const { users } = await import("../db/schema");
const { projectRoutes } = await import("./projects");
const { entityRoutes } = await import("./entities");
const { createApiKeyForUser } = await import("../services/api-keys");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const USER_ID = "user-projects";

if (db.select().from(users).all().length === 0) {
  db.insert(users)
    .values({ id: USER_ID, email: "projects@tarima.test", createdAt: Date.now() })
    .run();
}

const KEY = createApiKeyForUser(db, USER_ID, "test", [
  "projects:read",
  "projects:write",
  "entities:read",
  "entities:write",
]).secret;

const app = new Hono().route("/", projectRoutes).route("/", entityRoutes);

const auth = () => ({ Authorization: `Bearer ${KEY}`, "content-type": "application/json" });

const json = (body: unknown) => ({
  method: "POST",
  headers: auth(),
  body: JSON.stringify(body),
});

describe("project routes", () => {
  it("creates a project and lists it back", async () => {
    const created = await app.request(
      "/api/projects",
      json({ name: "venue group", goal: { deliverables: ["logo"] } }),
    );
    expect(created.status).toBe(201);
    const body = (await created.json()) as {
      project: { id: string; name: string; goal: Record<string, unknown>; createdAt: string };
    };
    expect(body.project.name).toBe("venue group");
    expect(body.project.goal).toEqual({ deliverables: ["logo"] });
    expect(body.project.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const listed = await app.request("/api/projects", { headers: auth() });
    expect(listed.status).toBe(200);
    const projects = (await listed.json()) as { projects: { id: string }[] };
    expect(projects.projects.map((p) => p.id)).toContain(body.project.id);
  });

  it("rejects an invalid body with 400", async () => {
    const res = await app.request("/api/projects", json({ name: "" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_request" });
  });

  it("answers 404 for an unknown project id", async () => {
    const res = await app.request("/api/projects/2f1b6e3a-0000-4000-8000-000000000000", {
      headers: auth(),
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });

  it("patches a project", async () => {
    const created = await app.request("/api/projects", json({ name: "before" }));
    const { project } = (await created.json()) as { project: { id: string } };

    const patched = await app.request(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: auth(),
      body: JSON.stringify({ name: "after" }),
    });
    expect(patched.status).toBe(200);
    expect(((await patched.json()) as { project: { name: string } }).project.name).toBe("after");
  });

  it("creates an entity under a project and reads it back", async () => {
    const created = await app.request("/api/projects", json({ name: "with rows" }));
    const { project } = (await created.json()) as { project: { id: string } };

    const entity = await app.request(
      `/api/projects/${project.id}/entities`,
      json({
        name: "Acme",
        contact: "hi@acme.test",
        status: "intake",
        missing: ["vector logo"],
      }),
    );
    expect(entity.status).toBe(201);
    const body = (await entity.json()) as {
      entity: { id: string; contact: string; missing: string[]; status: string };
    };
    expect(body.entity.contact).toBe("hi@acme.test");
    expect(body.entity.missing).toEqual(["vector logo"]);
    expect(body.entity.status).toBe("intake");

    const read = await app.request(`/api/entities/${body.entity.id}`, { headers: auth() });
    expect(read.status).toBe(200);
    expect(((await read.json()) as { entity: { missing: string[] } }).entity.missing).toEqual([
      "vector logo",
    ]);
  });

  it("answers 401 without a bearer key", async () => {
    const res = await app.request("/api/projects");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });
});
