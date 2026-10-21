import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// The database url must be set BEFORE the db module is imported: the
// api opens the sqlite file at import time.
const dir = mkdtempSync(join(tmpdir(), "tarima-workflows-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { Hono } = await import("hono");
const { db } = await import("../db");
const { users } = await import("../db/schema");
const { projectRoutes } = await import("./projects");
const { workflowRoutes } = await import("./workflows");
const { createApiKeyForUser } = await import("../services/api-keys");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const USER_ID = "user-workflows";

if (db.select().from(users).all().length === 0) {
  db.insert(users).values({ id: USER_ID, email: "wf@tarima.test", createdAt: Date.now() }).run();
}

const KEY = createApiKeyForUser(db, USER_ID, "test", [
  "projects:read",
  "projects:write",
  "entities:read",
  "entities:write",
  "workflows:read",
  "workflows:write",
]).secret;

const app = new Hono().route("/", projectRoutes).route("/", workflowRoutes);

const auth = () => ({ Authorization: `Bearer ${KEY}`, "content-type": "application/json" });

describe("workflow routes", () => {
  it("starts a chase run per waiting entity and reads the journal back", async () => {
    const created = await app.request("/api/projects", {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({ name: "chase me" }),
    });
    const { project } = (await created.json()) as { project: { id: string } };

    const entity = await app.request(`/api/projects/${project.id}/entities`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({
        name: "Acme",
        contact: "hi@acme.test",
        status: "intake",
        missing: [],
      }),
    });
    const { entity: row } = (await entity.json()) as { entity: { id: string } };

    const triggered = await app.request(`/api/projects/${project.id}/workflows`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({ template: "chase-deliverables" }),
    });
    expect(triggered.status).toBe(201);
    const { runs } = (await triggered.json()) as { runs: { runId: string; entityId: string }[] };
    expect(runs).toHaveLength(1);
    expect(runs[0].entityId).toBe(row.id);

    const read = await app.request(`/api/workflows/${runs[0].runId}`, { headers: auth() });
    expect(read.status).toBe(200);
    const view = (await read.json()) as {
      run: { id: string; type: string; state: string };
      steps: { stepKey: string; status: string }[];
    };
    expect(view.run.id).toBe(runs[0].runId);
    expect(view.run.type).toBe("chase-deliverables");
    expect(view.run.state).toBe("intake");
    expect(view.steps.map((step) => step.stepKey)).toContain("chase.intake");
  });

  it("rejects an unknown template with 400", async () => {
    const created = await app.request("/api/projects", {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({ name: "no template" }),
    });
    const { project } = (await created.json()) as { project: { id: string } };

    const res = await app.request(`/api/projects/${project.id}/workflows`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify({ template: "nope" }),
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_request" });
  });

  it("answers 404 for an unknown run id", async () => {
    const res = await app.request("/api/workflows/does-not-exist", { headers: auth() });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });
});
