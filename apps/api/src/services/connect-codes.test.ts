import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

// The database url must be set BEFORE the db module is imported: the
// api opens the sqlite file at import time.
const dir = mkdtempSync(join(tmpdir(), "tarima-codes-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { connectCodes, users } = await import("../db/schema");
const { CODE_TTL_MS, createConnectCode, hashCode, resolveConnectCode } =
  await import("./connect-codes");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const USER_ID = "user-codes";

beforeEach(() => {
  db.delete(connectCodes).run();
  db.insert(users)
    .values({ id: USER_ID, email: "codes@tarima.test", createdAt: Date.now() })
    .onConflictDoNothing()
    .run();
});

describe("connect codes", () => {
  it("mints a 6 char code from an unambiguous alphabet", () => {
    const created = createConnectCode(db, USER_ID, "telegram");
    expect(created.code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it("stores the code hashed, never in plaintext", () => {
    const created = createConnectCode(db, USER_ID, "telegram");
    const rows = db.select().from(connectCodes).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.codeHash).toBe(hashCode(created.code));
    expect(rows[0]?.codeHash).not.toBe(created.code);
  });

  it("expires the code after the contract TTL", () => {
    const created = createConnectCode(db, USER_ID, "telegram");
    const row = db.select().from(connectCodes).all()[0]!;
    expect(row.expiresAt).toBeGreaterThan(Date.now());
    expect(row.expiresAt).toBeLessThanOrEqual(Date.now() + CODE_TTL_MS);
    expect(created.expiresAt).toBe(new Date(row.expiresAt).toISOString());
  });

  it("resolves a live code once and marks it consumed", () => {
    const created = createConnectCode(db, USER_ID, "telegram");
    const first = resolveConnectCode(db, "telegram", created.code);
    expect(first).toEqual({ ok: true, userId: USER_ID });

    const second = resolveConnectCode(db, "telegram", created.code);
    expect(second).toEqual({ ok: false, reason: "invalid" });
  });

  it("accepts a lowercase code", () => {
    const created = createConnectCode(db, USER_ID, "whatsapp");
    expect(resolveConnectCode(db, "whatsapp", created.code.toLowerCase()).ok).toBe(true);
  });

  it("does not resolve a code on another channel", () => {
    const created = createConnectCode(db, USER_ID, "telegram");
    expect(resolveConnectCode(db, "whatsapp", created.code)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("does not resolve an unknown code", () => {
    expect(resolveConnectCode(db, "telegram", "ZZZZZZ")).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("does not resolve an expired code", () => {
    const created = createConnectCode(db, USER_ID, "telegram");
    db.update(connectCodes)
      .set({ expiresAt: Date.now() - 1 })
      .run();
    expect(resolveConnectCode(db, "telegram", created.code).ok).toBe(false);
  });
});
