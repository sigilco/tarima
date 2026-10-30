import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// The database url must be set BEFORE the db module is imported: the
// api opens the sqlite file at import time.
const dir = mkdtempSync(join(tmpdir(), "tarima-ui-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { Hono } = await import("hono");
const { db } = await import("../db");
const { users } = await import("../db/schema");
const { uiRoutes } = await import("./ui");
const { createSessionToken, sessionCookieHeader } = await import("@tarima/auth-core/session");

const USER_ID = "user-ui";
const SECRET = "ui-test-session-secret";

// The session module resolves the signing secret from the environment;
// set it before the first session token is minted.
process.env.SESSION_SECRET = SECRET;

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const app = new Hono().route("/", uiRoutes);

const cookie = () => sessionCookieHeader(createSessionToken(USER_ID, SECRET, 3600), false);

const json = (body: unknown, withCookie = true) => ({
  method: "POST",
  headers: {
    "content-type": "application/json",
    ...(withCookie ? { Cookie: cookie() } : {}),
  },
  body: JSON.stringify(body),
});

let projectId: string;

beforeAll(async () => {
  db.insert(users)
    .values({ id: USER_ID, email: "ui@tarima.test", createdAt: Date.now() })
    .onConflictDoNothing()
    .run();

  const created = await app.request("/api/ui/projects", json({ name: "UI Board Project" }));
  projectId = ((await created.json()) as { project: { id: string } }).project.id;
});

describe("ui routes: session gate", () => {
  it("answers 401 without a session cookie", async () => {
    const paths = ["/api/ui/projects", `/api/ui/projects/${projectId}/board`];
    const results = await Promise.all(
      paths.map(async (path) => {
        const res = await app.request(path);
        return { status: res.status, body: (await res.json()) as unknown };
      }),
    );
    for (const res of results) {
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "unauthorized" });
    }
  });

  it("answers 401 for an invalid session cookie", async () => {
    const res = await app.request("/api/ui/projects", {
      headers: { Cookie: "tarima_session=bogus.token.sig" },
    });
    expect(res.status).toBe(401);
  });

  it("answers 200 with a valid session cookie", async () => {
    const res = await app.request("/api/ui/projects", { headers: { Cookie: cookie() } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { projects: { id: string }[] };
    expect(body.projects.map((p) => p.id)).toContain(projectId);
  });
});

describe("ui routes: board payload", () => {
  it("returns the project, its rows and the bucket summary in one call", async () => {
    const bulk = await app.request(
      `/api/ui/projects/${projectId}/entities/bulk`,
      json({ csv: "name,contact,missing\nAcme,ops@acme.test,logo;deck\nStuck,,\n" }),
    );
    expect(bulk.status).toBe(200);

    const res = await app.request(`/api/ui/projects/${projectId}/board`, {
      headers: { Cookie: cookie() },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      project: { id: string };
      entities: { name: string; missing: string[] }[];
      summary: { buckets: { bucket: string; count: number }[]; total: number };
    };
    expect(body.project.id).toBe(projectId);
    expect(body.entities.map((e) => e.name)).toEqual(["Acme", "Stuck"]);
    expect(body.entities[0]?.missing).toEqual(["logo", "deck"]);
    expect(body.summary.total).toBe(2);
    expect(body.summary.buckets.find((b) => b.bucket === "chasing")).toEqual({
      bucket: "chasing",
      count: 2,
    });
  });

  it("answers 404 for an unknown project id", async () => {
    const res = await app.request("/api/ui/projects/55555555-5555-4555-8555-555555555555/board", {
      headers: { Cookie: cookie() },
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
  });
});

describe("ui routes: bulk intake", () => {
  it("rejects an unusable csv with 400 and per-row errors otherwise", async () => {
    const fatal = await app.request(
      `/api/ui/projects/${projectId}/entities/bulk`,
      json({ csv: "contact\na@b.co\n" }),
    );
    expect(fatal.status).toBe(400);

    const partial = await app.request(
      `/api/ui/projects/${projectId}/entities/bulk`,
      json({ csv: "name\nGood Row\n\n\n" }),
    );
    expect(partial.status).toBe(200);
    const body = (await partial.json()) as { created: number; errors: unknown[] };
    expect(body.created).toBe(1);
    expect(body.errors).toEqual([]);
  });
});

describe("ui routes: workflows", () => {
  it("rejects an unknown template with 400 and accepts the chase template", async () => {
    const bad = await app.request(
      `/api/ui/projects/${projectId}/workflows`,
      json({ template: "not-a-template" }),
    );
    expect(bad.status).toBe(400);

    const good = await app.request(
      `/api/ui/projects/${projectId}/workflows`,
      json({ template: "chase-deliverables" }),
    );
    expect(good.status).toBe(201);
    const body = (await good.json()) as { runs: { entityId: string }[] };
    expect(body.runs.length).toBeGreaterThan(0);
  });
});

describe("ui routes: manual add row", () => {
  it("creates a row with contact, channel and missing and lists it on the board", async () => {
    const res = await app.request(
      `/api/ui/projects/${projectId}/entities`,
      json({ name: "Manual Venue", contact: "hi@venue.test", channel: "email", missing: ["menu"] }),
    );
    expect(res.status).toBe(201);
    const { entity } = (await res.json()) as {
      entity: { name: string; contact: string; channel: string; missing: string[] };
    };
    expect(entity.name).toBe("Manual Venue");
    expect(entity.contact).toBe("hi@venue.test");
    expect(entity.channel).toBe("email");
    expect(entity.missing).toEqual(["menu"]);

    const board = await app.request(`/api/ui/projects/${projectId}/board`, {
      headers: { Cookie: cookie() },
    });
    const body = (await board.json()) as { entities: { name: string }[] };
    expect(body.entities.map((e) => e.name)).toContain("Manual Venue");
  });

  it("rejects a row without a name or with a bad channel", async () => {
    const noName = await app.request(
      `/api/ui/projects/${projectId}/entities`,
      json({ contact: "x@y.test" }),
    );
    expect(noName.status).toBe(400);

    const badChannel = await app.request(
      `/api/ui/projects/${projectId}/entities`,
      json({ name: "X", channel: "fax" }),
    );
    expect(badChannel.status).toBe(400);
  });

  it("answers 404 for an unknown project", async () => {
    const res = await app.request(
      "/api/ui/projects/55555555-5555-4555-8555-555555555555/entities",
      json({ name: "X" }),
    );
    expect(res.status).toBe(404);
  });
});

describe("ui routes: owner scoping", () => {
  it("hides another owner's project and project list entries", async () => {
    const otherId = "user-other";
    db.insert(users)
      .values({ id: otherId, email: "other@tarima.test", createdAt: Date.now() })
      .onConflictDoNothing()
      .run();

    // A project owned by the other user, created directly in the db.
    const { createProject } = await import("../services/projects");
    const theirs = createProject(db, { name: "not mine", ownerId: otherId });

    const listed = await app.request("/api/ui/projects", { headers: { Cookie: cookie() } });
    const body = (await listed.json()) as { projects: { id: string }[] };
    expect(body.projects.map((p) => p.id)).not.toContain(theirs.id);

    const detail = await app.request(`/api/ui/projects/${theirs.id}`, {
      headers: { Cookie: cookie() },
    });
    expect(detail.status).toBe(404);

    const board = await app.request(`/api/ui/projects/${theirs.id}/board`, {
      headers: { Cookie: cookie() },
    });
    expect(board.status).toBe(404);
  });
});

describe("ui routes: brief on create", () => {
  it("accepts a project with a valid brief and rejects a malformed one", async () => {
    const good = await app.request(
      "/api/ui/projects",
      json({
        name: "Briefed",
        goal: {
          brief: {
            eventType: "founder dinner",
            city: "Paris",
            headcount: 25,
            budgetAmount: 3500,
            currency: "EUR",
          },
        },
      }),
    );
    expect(good.status).toBe(201);
    const { project } = (await good.json()) as { project: { goal: Record<string, unknown> } };
    expect(project.goal.brief).toBeTruthy();

    const bad = await app.request(
      "/api/ui/projects",
      json({ name: "Bad brief", goal: { brief: { eventType: "dinner" } } }),
    );
    expect(bad.status).toBe(400);
  });
});
