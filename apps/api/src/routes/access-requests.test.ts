import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-access-requests-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { Hono } = await import("hono");
const { db } = await import("../db");
const { accessRequests } = await import("../db/schema");
const { accessRequestRoutes } = await import("./access-requests");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const app = new Hono().route("/", accessRequestRoutes);

const post = (body: unknown, headers?: Record<string, string>) =>
  app.request("/api/access-requests", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /api/access-requests", () => {
  it("stores a valid email and returns 201", async () => {
    const res = await post({ email: "lead@example.com", intent: "Organizer for 100 people" });
    expect(res.status).toBe(201);
    const json = (await res.json()) as { ok: boolean };
    expect(json).toEqual({ ok: true });

    const rows = db.select().from(accessRequests).all();
    const stored = rows.find((r) => r.email === "lead@example.com");
    expect(stored).toBeDefined();
    expect(stored?.email).toBe("lead@example.com");
    expect(stored?.intent).toBe("Organizer for 100 people");
  });

  it("normalizes the email address", async () => {
    const res = await post({ email: "  User.Name@Example.COM  " });
    expect(res.status).toBe(201);

    const rows = db.select().from(accessRequests).all();
    const stored = rows.find((r) => r.email === "user.name@example.com");
    expect(stored).toBeDefined();
    expect(stored?.intent).toBeNull();
  });

  it("returns 400 and stores nothing for an invalid email", async () => {
    const beforeCount = db.select().from(accessRequests).all().length;

    const res = await post({ email: "not-an-email" });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json).toEqual({ error: "invalid_email" });

    const afterCount = db.select().from(accessRequests).all().length;
    expect(afterCount).toBe(beforeCount);
  });

  it("returns 400 for a non-object body", async () => {
    const beforeCount = db.select().from(accessRequests).all().length;

    const res1 = await post(12345);
    expect(res1.status).toBe(400);
    expect(await res1.json()).toEqual({ error: "invalid_body" });

    const res2 = await post("plain string");
    expect(res2.status).toBe(400);
    expect(await res2.json()).toEqual({ error: "invalid_body" });

    const res3 = await post(["array@example.com"]);
    expect(res3.status).toBe(400);
    expect(await res3.json()).toEqual({ error: "invalid_body" });

    const afterCount = db.select().from(accessRequests).all().length;
    expect(afterCount).toBe(beforeCount);
  });

  it("returns 400 for malformed json", async () => {
    const beforeCount = db.select().from(accessRequests).all().length;

    const res = await post("{invalid-json", { "content-type": "application/json" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_body" });

    const afterCount = db.select().from(accessRequests).all().length;
    expect(afterCount).toBe(beforeCount);
  });
});
