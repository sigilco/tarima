import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// The database url must be set BEFORE the db module is imported: the
// api opens the sqlite file at import time.
const dir = mkdtempSync(join(tmpdir(), "tarima-observer-svc-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { projects, users } = await import("../db/schema");
const {
  currentObserverLink,
  getOrCreateObserverLink,
  getProjectOwnerAttribution,
  incrementObserverViewCount,
  isLive,
  maskEmail,
  resolveObserverLink,
  revokeObserverLinks,
  toObserverLink,
} = await import("./observer-links");

const OWNER = "u-obs-owner";
const PROJECT = "p-obs-1";
const OTHER_PROJECT = "p-obs-2";

afterAll(() => rmSync(dir, { recursive: true, force: true }));

beforeAll(() => {
  db.insert(users)
    .values({ id: OWNER, email: "owner@example.com", name: "Olive", role: "member" })
    .onConflictDoNothing()
    .run();
  db.insert(projects)
    .values([
      { id: PROJECT, ownerId: OWNER, name: "Berkeley evening" },
      { id: OTHER_PROJECT, ownerId: OWNER, name: "Other" },
    ])
    .onConflictDoNothing()
    .run();
});

describe("observer links service", () => {
  it("mints a 48-hex token and is idempotent per project", () => {
    const first = getOrCreateObserverLink(db, PROJECT, OWNER);
    expect(first.token).toMatch(/^[a-f0-9]{48}$/);
    expect(first.roomId).toBeNull();

    const second = getOrCreateObserverLink(db, PROJECT, OWNER);
    expect(second.id).toBe(first.id);
    expect(second.token).toBe(first.token);
  });

  it("resolves only for the minted project", () => {
    const link = currentObserverLink(db, PROJECT);
    expect(link).not.toBeNull();
    expect(resolveObserverLink(db, link!.token, PROJECT)?.id).toBe(link!.id);
    // Wrong project and bogus tokens both read as null (uniform 401).
    expect(resolveObserverLink(db, link!.token, OTHER_PROJECT)).toBeNull();
    expect(resolveObserverLink(db, "0".repeat(48), PROJECT)).toBeNull();
  });

  it("revocation kills the link and a fresh one can be minted", () => {
    const live = currentObserverLink(db, PROJECT)!;
    const { revokedAt } = revokeObserverLinks(db, PROJECT);
    expect(revokedAt).toBeGreaterThan(0);
    expect(resolveObserverLink(db, live.token, PROJECT)).toBeNull();
    expect(currentObserverLink(db, PROJECT)).toBeNull();

    const fresh = getOrCreateObserverLink(db, PROJECT, OWNER);
    expect(fresh.id).not.toBe(live.id);
    expect(resolveObserverLink(db, fresh.token, PROJECT)).not.toBeNull();
  });

  it("expiry and revocation make a link not live", () => {
    expect(isLive({ revokedAt: null, expiresAt: Date.now() + 1000 })).toBe(true);
    expect(isLive({ revokedAt: null, expiresAt: Date.now() - 1000 })).toBe(false);
    expect(isLive({ revokedAt: Date.now(), expiresAt: null })).toBe(false);
  });

  it("tracks views and masks the owner email", () => {
    const link = currentObserverLink(db, PROJECT)!;
    incrementObserverViewCount(db, link.token);
    incrementObserverViewCount(db, link.token);
    const after = currentObserverLink(db, PROJECT)!;
    expect(after.viewCount).toBe(link.viewCount + 2);
    expect(after.lastViewedAt).not.toBeNull();

    expect(maskEmail("alex@example.com")).toBe("a***@example.com");
    expect(getProjectOwnerAttribution(db, PROJECT)).toEqual({ displayName: "Olive" });
  });

  it("toObserverLink points at the new /app/o/ surface", () => {
    const link = currentObserverLink(db, PROJECT)!;
    const wire = toObserverLink(link, "https://tarima.example");
    expect(wire.shareUrl).toBe(`https://tarima.example/app/o/${PROJECT}?share_token=${link.token}`);
  });
});
