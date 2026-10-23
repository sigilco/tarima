import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// The database url must be set BEFORE the db module is imported: the
// api opens the sqlite file at import time.
const dir = mkdtempSync(join(tmpdir(), "tarima-keys-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { Hono } = await import("hono");
const { db } = await import("../db");
const { users } = await import("../db/schema");
const { apiKeyRoutes } = await import("./api-keys");
const { requireApiKey } = await import("../middleware/require-api-key");
const { createSessionToken, sessionCookieHeader } = await import("@tarima/auth-core/session");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const USER_ID = "user-keys";
const SECRET = "test-session-secret";

// The session module resolves the signing secret from the environment;
// set it before the first session token is minted.
process.env.SESSION_SECRET = SECRET;

if (db.select().from(users).all().length === 0) {
  db.insert(users).values({ id: USER_ID, email: "keys@tarima.test", createdAt: Date.now() }).run();
}

/** The api key routes plus one protected route to exercise a Bearer key. */
const app = new Hono()
  .route("/", apiKeyRoutes)
  .get("/api/projects", requireApiKey(["projects:read"]), (c) => c.json({ projects: [] }));

const json = (body: unknown) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

const bearer = (key: string) => ({ Authorization: `Bearer ${key}` });

describe("api key routes", () => {
  it("mints a key for the session caller and returns the plaintext once", async () => {
    const token = createSessionToken(USER_ID, SECRET, 3600);
    const res = await app.request("/api/api-keys", {
      ...json({ name: "ci-bot", scopes: ["projects:read", "entities:write"] }),
      headers: {
        "content-type": "application/json",
        Cookie: sessionCookieHeader(token, false),
      },
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      id: string;
      name: string;
      prefix: string;
      scopes: string[];
      createdAt: string;
      key: string;
    };
    expect(body.name).toBe("ci-bot");
    expect(body.scopes).toEqual(["projects:read", "entities:write"]);
    expect(body.key).toMatch(/^tarima_/);
    expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // The list never carries the secret or the hash.
    const list = await app.request("/api/api-keys", {
      headers: { Cookie: sessionCookieHeader(token, false) },
    });
    expect(list.status).toBe(200);
    const listed = (await list.json()) as { keys: Record<string, unknown>[] };
    expect(listed.keys).toHaveLength(1);
    expect(listed.keys[0]).not.toHaveProperty("key");
    expect(listed.keys[0]).not.toHaveProperty("keyHash");
  });

  it("uses a minted key as a Bearer token on a protected route", async () => {
    const token = createSessionToken(USER_ID, SECRET, 3600);
    const created = await app.request("/api/api-keys", {
      ...json({ name: "agent", scopes: ["projects:read"] }),
      headers: {
        "content-type": "application/json",
        Cookie: sessionCookieHeader(token, false),
      },
    });
    const key = ((await created.json()) as { key: string }).key;

    const res = await app.request("/api/projects", { headers: bearer(key) });
    expect(res.status).toBe(200);
  });

  it("answers 401 for a revoked key", async () => {
    const token = createSessionToken(USER_ID, SECRET, 3600);
    const created = await app.request("/api/api-keys", {
      ...json({ name: "revoked", scopes: ["projects:read"] }),
      headers: {
        "content-type": "application/json",
        Cookie: sessionCookieHeader(token, false),
      },
    });
    const body = (await created.json()) as { id: string; key: string };

    const del = await app.request(`/api/api-keys/${body.id}`, {
      method: "DELETE",
      headers: { Cookie: sessionCookieHeader(token, false) },
    });
    expect(del.status).toBe(200);

    const res = await app.request("/api/projects", { headers: bearer(body.key) });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("answers 401 without any credential and 404 for an unknown key id", async () => {
    const anon = await app.request("/api/api-keys");
    expect(anon.status).toBe(401);

    const token = createSessionToken(USER_ID, SECRET, 3600);
    const del = await app.request("/api/api-keys/does-not-exist", {
      method: "DELETE",
      headers: { Cookie: sessionCookieHeader(token, false) },
    });
    expect(del.status).toBe(404);
    expect(await del.json()).toEqual({ error: "not_found" });
  });

  it("rejects an unknown scope with 400", async () => {
    const token = createSessionToken(USER_ID, SECRET, 3600);
    const res = await app.request("/api/api-keys", {
      ...json({ name: "typo", scopes: ["project:read"] }),
      headers: {
        "content-type": "application/json",
        Cookie: sessionCookieHeader(token, false),
      },
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_request" });
  });
});
