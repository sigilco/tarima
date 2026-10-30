import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-settings-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-secret";

const { Hono } = await import("hono");
const { db } = await import("../db");
const { channelBindings, connectCodes, projects, userMessages, users } =
  await import("../db/schema");
const { settingsRoutes } = await import("./settings");
const { storeInAppMessage } = await import("../services/notify");
const { fanoutNotify } = await import("../services/notify");
const { hashCode } = await import("../services/connect-codes");
const { createSessionToken } = await import("@tarima/auth-core/session");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const USER_ID = "user-settings";
const EMAIL = "settings@tarima.test";

/** A project of the test user (the inbox rows point at it). */
const PROJECT_ID = randomUUID();

const app = new Hono().route("/", settingsRoutes);

/** A request with the session cookie of the test user. */
function call(path: string, init?: RequestInit): Promise<Response> {
  const cookie = createSessionToken(USER_ID, "test-secret");
  return app.request(path, {
    ...init,
    headers: { ...(init?.headers ?? {}), cookie: `tarima_session=${cookie}` },
  });
}

beforeAll(() => {
  db.insert(users)
    .values({ id: USER_ID, email: EMAIL, createdAt: Date.now() })
    .onConflictDoNothing()
    .run();
  db.insert(projects)
    .values({
      id: PROJECT_ID,
      ownerId: USER_ID,
      name: "Settings project",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    .onConflictDoNothing()
    .run();
});

beforeEach(() => {
  db.delete(userMessages).run();
  db.delete(channelBindings).run();
  db.delete(connectCodes).run();
});

describe("settings routes", () => {
  it("answers 401 without a session", async () => {
    const res = await app.request("/api/ui/settings");
    expect(res.status).toBe(401);
  });

  it("mints a connect code and lists it hashed in the db", async () => {
    const res = await call("/api/ui/settings/connect-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel: "telegram" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { code: string; expiresAt: string };
    expect(body.code).toMatch(/^[A-Z0-9]{6}$/);

    const rows = db.select().from(connectCodes).all();
    expect(rows[0]?.codeHash).toBe(hashCode(body.code));
  });

  it("rejects an unknown channel", async () => {
    const res = await call("/api/ui/settings/connect-code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channel: "smoke-signal" }),
    });
    expect(res.status).toBe(400);
  });

  it("lists bindings and unbinds by id", async () => {
    const { bindChannel } = await import("../services/bindings");
    const binding = bindChannel(db, {
      userId: USER_ID,
      channel: "whatsapp",
      externalId: "34600111222",
    });

    const listed = await call("/api/ui/settings");
    const body = (await listed.json()) as { bindings: Array<{ id: string }>; unread: number };
    expect(body.bindings.map((b) => b.id)).toContain(binding.id);
    expect(body.unread).toBe(0);

    const removed = await call(`/api/ui/settings/bindings/${binding.id}`, { method: "DELETE" });
    expect(removed.status).toBe(200);
    expect(db.select().from(channelBindings).all()).toHaveLength(0);
  });

  it("shows the inbox with an unread count and marks messages read", async () => {
    storeInAppMessage(db, USER_ID, {
      projectId: PROJECT_ID,
      kind: "approval_needed",
      summary: "Approve the shortlist?",
    });

    const listed = await call("/api/ui/settings/messages");
    const body = (await listed.json()) as {
      messages: Array<{ id: string; summary: string; read: boolean }>;
      unread: number;
    };
    expect(body.unread).toBe(1);
    expect(body.messages[0]?.summary).toBe("Approve the shortlist?");
    expect(body.messages[0]?.read).toBe(false);

    const marked = await call("/api/ui/settings/messages/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: [body.messages[0]!.id] }),
    });
    expect(((await marked.json()) as { unread: number }).unread).toBe(0);
  });

  it("marks everything read without ids", async () => {
    storeInAppMessage(db, USER_ID, { projectId: PROJECT_ID, kind: "digest", summary: "a" });
    storeInAppMessage(db, USER_ID, { projectId: PROJECT_ID, kind: "digest", summary: "b" });

    const marked = await call("/api/ui/settings/messages/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(((await marked.json()) as { unread: number }).unread).toBe(0);
  });

  it("delivers a fanout to the inbox the settings page reads", async () => {
    await fanoutNotify(
      db,
      { projectId: PROJECT_ID, kind: "status_change", summary: "Acme replied" },
      {},
    );
    const listed = await call("/api/ui/settings/messages");
    const body = (await listed.json()) as { messages: Array<{ summary: string }>; unread: number };
    expect(body.unread).toBe(1);
    expect(body.messages[0]?.summary).toBe("Acme replied");
  });
});
