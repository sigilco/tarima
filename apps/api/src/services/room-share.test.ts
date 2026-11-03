import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-room-share-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { projects, users } = await import("../db/schema");
const {
  DEFAULT_ROOM_LINK_TTL_MS,
  getOrCreateRoomShareLink,
  getRoomOwnerAttribution,
  incrementRoomViewCount,
  isLive,
  maskEmail,
  mintShareToken,
  resolveRoomShareToken,
  revokeRoomShareLink,
} = await import("./room-share");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const USER_ID = "owner-123";
const PROJECT_A = "11111111-1111-4111-8111-111111111111";
const PROJECT_B = "22222222-2222-4222-8222-222222222222";

beforeAll(() => {
  const now = Date.now();
  db.insert(users)
    .values({
      id: USER_ID,
      email: "sarah.organizer@example.com",
      name: "Sarah Organizer",
      createdAt: now,
    })
    .run();

  db.insert(projects)
    .values([
      { id: PROJECT_A, ownerId: USER_ID, name: "Summit 2026", createdAt: now, updatedAt: now },
      { id: PROJECT_B, ownerId: USER_ID, name: "Concert Gala", createdAt: now, updatedAt: now },
    ])
    .run();
});

describe("room share token generation", () => {
  it("mints 192-bit hex tokens (48 chars)", () => {
    const token = mintShareToken();
    expect(token).toMatch(/^[a-f0-9]{48}$/);
  });

  it("mints unique tokens across calls", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => mintShareToken()));
    expect(tokens.size).toBe(20);
  });
});

describe("room share link lifecycle", () => {
  it("creates a link with 7-day default expiry", () => {
    const before = Date.now();
    const link = getOrCreateRoomShareLink(db, PROJECT_A, USER_ID);
    const after = Date.now();

    expect(link.token).toMatch(/^[a-f0-9]{48}$/);
    expect(link.projectId).toBe(PROJECT_A);
    expect(link.revokedAt).toBeNull();
    expect(link.viewCount).toBe(0);
    expect(link.lastViewedAt).toBeNull();
    expect(link.expiresAt).toBeDefined();

    const lifetime = (link.expiresAt ?? 0) - link.createdAt;
    expect(lifetime).toBe(DEFAULT_ROOM_LINK_TTL_MS);
    expect(link.createdAt).toBeGreaterThanOrEqual(before);
    expect(link.createdAt).toBeLessThanOrEqual(after);
  });

  it("is idempotent: returns the same live link on subsequent calls", () => {
    const link1 = getOrCreateRoomShareLink(db, PROJECT_A, USER_ID);
    const link2 = getOrCreateRoomShareLink(db, PROJECT_A, USER_ID);

    expect(link2.id).toBe(link1.id);
    expect(link2.token).toBe(link1.token);
  });

  it("resolves a live link strictly within its scoped project", () => {
    const link = getOrCreateRoomShareLink(db, PROJECT_A, USER_ID);

    const resolvedA = resolveRoomShareToken(db, link.token, PROJECT_A);
    expect(resolvedA).toBeDefined();
    expect(resolvedA?.id).toBe(link.id);

    // Mismatched project scope must NOT resolve
    const resolvedB = resolveRoomShareToken(db, link.token, PROJECT_B);
    expect(resolvedB).toBeNull();
  });

  it("increments view count and updates lastViewedAt", () => {
    const link = getOrCreateRoomShareLink(db, PROJECT_A, USER_ID);
    expect(link.viewCount).toBe(0);

    incrementRoomViewCount(db, link.token);
    const resolved = resolveRoomShareToken(db, link.token, PROJECT_A);
    expect(resolved?.viewCount).toBe(1);
    expect(resolved?.lastViewedAt).toBeGreaterThan(0);
  });

  it("revokes active link and remints cleanly on subsequent request", () => {
    const original = getOrCreateRoomShareLink(db, PROJECT_A, USER_ID);
    const revokeResult = revokeRoomShareLink(db, PROJECT_A);
    expect(revokeResult.ok).toBe(true);
    expect(revokeResult.revokedAt).toBeGreaterThan(0);

    // Revoked link no longer resolves
    expect(resolveRoomShareToken(db, original.token, PROJECT_A)).toBeNull();

    // Re-mint creates a new live link
    const reminted = getOrCreateRoomShareLink(db, PROJECT_A, USER_ID);
    expect(reminted.id).not.toBe(original.id);
    expect(reminted.token).not.toBe(original.token);
    expect(isLive(reminted, Date.now())).toBe(true);
  });

  it("does not resolve expired links", () => {
    // Create an already-expired link with 0 ttl
    const expired = getOrCreateRoomShareLink(db, PROJECT_B, USER_ID, { ttlDays: 1 });
    expect(isLive(expired, Date.now())).toBe(true);

    const simulatedFutureTime = (expired.expiresAt ?? 0) + 1000;
    expect(isLive(expired, simulatedFutureTime)).toBe(false);
  });
});

describe("attribution and redaction", () => {
  it("masks emails safely without leaking local part", () => {
    expect(maskEmail("alex@example.com")).toBe("a***@example.com");
    expect(maskEmail("b@domain.org")).toBe("b***@domain.org");
    expect(maskEmail("malformed")).toBe("***");
  });

  it("retrieves owner display name for attribution banner", () => {
    const attribution = getRoomOwnerAttribution(db, PROJECT_A);
    expect(attribution.displayName).toBe("Sarah Organizer");
  });
});
