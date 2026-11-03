import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-room-routes-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const SECRET = "room-test-secret";
process.env.SESSION_SECRET = SECRET;

const { Hono } = await import("hono");
const { db } = await import("../db");
const { projects, users } = await import("../db/schema");
const { roomRoutes } = await import("./room");
const { eventRoutes } = await import("./events");
const { auditActorFields } = await import("../middleware/require-room-access");
const { createSessionToken, sessionCookieHeader } = await import("@tarima/auth-core/session");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const OWNER_ID = "room-owner-user";
const NON_OWNER_ID = "room-stranger-user";
const PROJECT_A = "11111111-1111-4111-8111-111111111111";
const PROJECT_B = "22222222-2222-4222-8222-222222222222";

const app = new Hono().route("/", roomRoutes).route("/", eventRoutes);

const ownerCookie = () => sessionCookieHeader(createSessionToken(OWNER_ID, SECRET, 3600), false);

const strangerCookie = () =>
  sessionCookieHeader(createSessionToken(NON_OWNER_ID, SECRET, 3600), false);

beforeAll(() => {
  const now = Date.now();
  db.insert(users)
    .values([
      { id: OWNER_ID, email: "owner@tarima.test", name: "Alice Owner", createdAt: now },
      { id: NON_OWNER_ID, email: "stranger@tarima.test", name: "Bob Stranger", createdAt: now },
    ])
    .run();

  db.insert(projects)
    .values([
      { id: PROJECT_A, ownerId: OWNER_ID, name: "Alpha Showcase", createdAt: now, updatedAt: now },
      { id: PROJECT_B, ownerId: NON_OWNER_ID, name: "Beta Venue", createdAt: now, updatedAt: now },
    ])
    .run();
});

describe("POST /api/ui/projects/:projectId/room-link (minting)", () => {
  it("allows owner to mint a live observer link", async () => {
    const res = await app.request(`/api/ui/projects/${PROJECT_A}/room-link`, {
      method: "POST",
      headers: { Cookie: ownerCookie(), "Content-Type": "application/json" },
      body: JSON.stringify({ ttlDays: 7 }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      link: { token: string; projectId: string; viewCount: number };
      shareUrl: string;
    };
    expect(body.link.projectId).toBe(PROJECT_A);
    expect(body.link.token).toMatch(/^[a-f0-9]{48}$/);
    expect(body.shareUrl).toContain(`/app/p/${PROJECT_A}/room?share_token=${body.link.token}`);
  });

  it("is idempotent: subsequent calls return the existing active link", async () => {
    const res1 = await app.request(`/api/ui/projects/${PROJECT_A}/room-link`, {
      method: "POST",
      headers: { Cookie: ownerCookie() },
    });
    const body1 = (await res1.json()) as { link: { token: string } };

    const res2 = await app.request(`/api/ui/projects/${PROJECT_A}/room-link`, {
      method: "POST",
      headers: { Cookie: ownerCookie() },
    });
    const body2 = (await res2.json()) as { link: { token: string } };

    expect(body2.link.token).toBe(body1.link.token);
  });

  it("denies unauthenticated requests with 401", async () => {
    const res = await app.request(`/api/ui/projects/${PROJECT_A}/room-link`, {
      method: "POST",
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-owner session (anti-probing: does not reveal existence)", async () => {
    const res = await app.request(`/api/ui/projects/${PROJECT_A}/room-link`, {
      method: "POST",
      headers: { Cookie: strangerCookie() },
    });
    expect(res.status).toBe(404);
  });
});

describe("GET /api/ui/projects/:projectId/room (read access)", () => {
  let shareToken: string;

  beforeAll(async () => {
    const res = await app.request(`/api/ui/projects/${PROJECT_A}/room-link`, {
      method: "POST",
      headers: { Cookie: ownerCookie() },
    });
    const body = (await res.json()) as { link: { token: string } };
    shareToken = body.link.token;
  });

  it("allows observer with valid share token (readOnly, PII redacted)", async () => {
    const res = await app.request(`/api/ui/projects/${PROJECT_A}/room?share_token=${shareToken}`);

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      project: { id: string; name: string };
      room: { name: string; status: string };
      access: { role: string; readOnly: boolean; sharedByName: string | null };
    };

    expect(body.project.id).toBe(PROJECT_A);
    expect(body.project.name).toBe("Alpha Showcase");
    expect(body.access.role).toBe("observer");
    expect(body.access.readOnly).toBe(true);
    expect(body.access.sharedByName).toBe("Alice Owner");
  });

  it("allows owner with session cookie (readOnly: false)", async () => {
    const res = await app.request(`/api/ui/projects/${PROJECT_A}/room`, {
      headers: { Cookie: ownerCookie() },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      access: { role: string; readOnly: boolean };
    };
    expect(body.access.role).toBe("owner");
    expect(body.access.readOnly).toBe(false);
  });

  it("rejects invalid token with 401 (anti-probing)", async () => {
    const res = await app.request(
      `/api/ui/projects/${PROJECT_A}/room?share_token=deadbeef0000000000000000000000000000000000000000`,
    );
    expect(res.status).toBe(401);
  });

  it("rejects token scoped to another project with 401 (anti-probing, no cross-project leakage)", async () => {
    // Attempt to access PROJECT_B with PROJECT_A's token
    const res = await app.request(`/api/ui/projects/${PROJECT_B}/room?share_token=${shareToken}`);
    expect(res.status).toBe(401);
  });

  it("returns 404 for stranger session without share token", async () => {
    const res = await app.request(`/api/ui/projects/${PROJECT_A}/room`, {
      headers: { Cookie: strangerCookie() },
    });
    expect(res.status).toBe(404);
  });
});

describe("Observer write restriction & revocation", () => {
  let shareToken: string;

  beforeAll(async () => {
    const res = await app.request(`/api/ui/projects/${PROJECT_A}/room-link`, {
      method: "POST",
      headers: { Cookie: ownerCookie() },
    });
    const body = (await res.json()) as { link: { token: string } };
    shareToken = body.link.token;
  });

  it("strictly forbids observer from mutating / creating room links", async () => {
    const res = await app.request(
      `/api/ui/projects/${PROJECT_A}/room-link?share_token=${shareToken}`,
      { method: "POST" },
    );
    expect(res.status).toBe(401);
  });

  it("strictly forbids observer from revoking room links", async () => {
    const res = await app.request(
      `/api/ui/projects/${PROJECT_A}/room-link?share_token=${shareToken}`,
      { method: "DELETE" },
    );
    expect(res.status).toBe(401);
  });

  it("allows owner to revoke link, after which observer is denied with 401", async () => {
    const deleteRes = await app.request(`/api/ui/projects/${PROJECT_A}/room-link`, {
      method: "DELETE",
      headers: { Cookie: ownerCookie() },
    });
    expect(deleteRes.status).toBe(200);
    const deleteBody = (await deleteRes.json()) as { ok: boolean };
    expect(deleteBody.ok).toBe(true);

    // Observer now receives 401
    const accessRes = await app.request(
      `/api/ui/projects/${PROJECT_A}/room?share_token=${shareToken}`,
    );
    expect(accessRes.status).toBe(401);
  });
});

describe("GET /api/ui/projects/:projectId/events (SSE stream)", () => {
  let shareToken: string;

  beforeAll(async () => {
    const res = await app.request(`/api/ui/projects/${PROJECT_A}/room-link`, {
      method: "POST",
      headers: { Cookie: ownerCookie() },
    });
    const body = (await res.json()) as { link: { token: string } };
    shareToken = body.link.token;
  });

  it("authenticates observer using query param ?share_token= and starts SSE stream", async () => {
    const res = await app.request(`/api/ui/projects/${PROJECT_A}/events?share_token=${shareToken}`);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
  });

  it("authenticates owner using session cookie and starts SSE stream", async () => {
    const res = await app.request(`/api/ui/projects/${PROJECT_A}/events`, {
      headers: { Cookie: ownerCookie() },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
  });

  it("rejects invalid token on SSE stream with 401", async () => {
    const res = await app.request(
      `/api/ui/projects/${PROJECT_A}/events?share_token=invalid000000000000000000000000000000000000000000`,
    );
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated request on SSE stream with 401", async () => {
    const res = await app.request(`/api/ui/projects/${PROJECT_A}/events`);
    expect(res.status).toBe(401);
  });
});

describe("audit logging actor projection", () => {
  it("projects sha256 prefix for observer share tokens (never raw token)", () => {
    const rawToken = "0123456789abcdef0123456789abcdef0123456789abcdef";
    const audit = auditActorFields({
      kind: "share-token",
      token: rawToken,
      projectId: PROJECT_A,
      roomId: null,
      role: "observer",
    });

    expect(audit.actorKind).toBe("share-token");
    expect(audit.actorId).toMatch(/^sha256:[a-f0-9]{12}$/);
    expect(audit.actorId).not.toContain(rawToken);
  });

  it("projects userId for session owners and null for anonymous", () => {
    const sessionAudit = auditActorFields({
      kind: "session",
      userId: OWNER_ID,
      role: "owner",
    });
    expect(sessionAudit).toEqual({ actorKind: "session", actorId: OWNER_ID });

    const anonAudit = auditActorFields({ kind: "anonymous" });
    expect(anonAudit).toEqual({ actorKind: "anonymous", actorId: null });
  });
});
