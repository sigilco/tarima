import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// The database url must be set BEFORE the db module is imported: the
// api opens the sqlite file at import time.
const dir = mkdtempSync(join(tmpdir(), "tarima-mw-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { Hono } = await import("hono");
const { db } = await import("../db");
const { users } = await import("../db/schema");
const { requireApiKey, getApiKey } = await import("./require-api-key");
const { createApiKeyForUser, listApiKeysForUser, revokeApiKey } =
  await import("../services/api-keys");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const USER_ID = "user-mw";

if (db.select().from(users).all().length === 0) {
  db.insert(users).values({ id: USER_ID, email: "mw@tarima.test", createdAt: Date.now() }).run();
}

/** Mint a key and return its plaintext plus its id. */
function mint(scopes: string[]): { secret: string; id: string } {
  const created = createApiKeyForUser(db, USER_ID, "test", scopes);
  return { secret: created.secret, id: created.id };
}

/** A tiny app with one protected route, so the middleware is exercised alone. */
function appWith(scopes: string[]) {
  const app = new Hono();
  app.get("/protected", requireApiKey(scopes), (c) => c.json({ ok: true }));
  return app;
}

describe("requireApiKey", () => {
  it("answers 401 when the Authorization header is missing", async () => {
    const app = appWith(["projects:read"]);
    const res = await app.request("/protected");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("answers 401 for a malformed key", async () => {
    const app = appWith(["projects:read"]);
    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer not-a-real-key" },
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("answers 401 for an unknown key", async () => {
    const app = appWith(["projects:read"]);
    const res = await app.request("/protected", {
      headers: { Authorization: "Bearer tarima_aaaaaa_bbbbbbbbbbbbbbbbbbbb" },
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("answers 403 when the key lacks the required scope", async () => {
    const { secret } = mint(["entities:read"]);
    const app = appWith(["projects:read"]);
    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${secret}` },
    });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "forbidden" });
  });

  it("answers 200 and exposes the key on the context", async () => {
    const { secret } = mint(["projects:read", "projects:write"]);
    const app = new Hono();
    app.get("/protected", requireApiKey(["projects:read"]), (c) => {
      const key = getApiKey(c);
      return c.json({ ok: true, userId: key?.userId, scopes: key?.scopes });
    });

    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${secret}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; userId: string; scopes: string[] };
    expect(body.ok).toBe(true);
    expect(body.userId).toBe(USER_ID);
    expect(body.scopes).toContain("projects:read");
  });

  it("answers 401 for a revoked key", async () => {
    const { secret, id } = mint(["projects:read"]);
    expect(revokeApiKey(db, USER_ID, id)).toBe(true);
    expect(listApiKeysForUser(db, USER_ID).find((key) => key.id === id)?.revokedAt).not.toBeNull();

    const app = appWith(["projects:read"]);
    const res = await app.request("/protected", {
      headers: { Authorization: `Bearer ${secret}` },
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });
});
