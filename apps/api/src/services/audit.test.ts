import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// The database url must be set BEFORE the db module is imported: the
// api opens the sqlite file at import time.
const dir = mkdtempSync(join(tmpdir(), "tarima-audit-svc-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { agentEvents, approvals } = await import("../db/schema");
const { listAuditApprovals, listAuditEvents } = await import("./audit");

const ALICE = "u-audit-alice";
const BOB = "u-audit-bob";

beforeAll(() => {
  const now = Date.now();
  db.insert(agentEvents)
    .values([
      {
        sessionId: "s-alice",
        line: 1,
        idx: 0,
        type: "turn.settled",
        principalId: ALICE,
        payload: {},
        createdAt: now,
      },
      {
        sessionId: "s-bob",
        line: 1,
        idx: 0,
        type: "turn.settled",
        principalId: BOB,
        payload: {},
        createdAt: now + 1,
      },
      {
        sessionId: "s-anon",
        line: 1,
        idx: 0,
        type: "turn.settled",
        principalId: null,
        payload: {},
        createdAt: now + 2,
      },
    ])
    .run();
  db.insert(approvals)
    .values([
      {
        id: "ap-alice",
        sessionId: "s-alice",
        interactionId: "i-1",
        toolName: "send_email",
        principalId: ALICE,
        status: "approved",
        requestPayload: {},
        decidedBy: ALICE,
        decidedAt: now,
        createdAt: now,
      },
      {
        id: "ap-bob",
        sessionId: "s-bob",
        interactionId: "i-2",
        toolName: "send_email",
        principalId: BOB,
        status: "pending",
        requestPayload: {},
        createdAt: now,
      },
    ])
    .run();
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("audit service", () => {
  it("scopes approvals to the caller's principal", () => {
    const rows = listAuditApprovals(db, ALICE);
    expect(rows.map((r) => r.id)).toEqual(["ap-alice"]);
    expect(rows[0].toolName).toBe("send_email");
    expect(listAuditApprovals(db, BOB).map((r) => r.id)).toEqual(["ap-bob"]);
  });

  it("scopes events to the caller and drops anonymous rows", () => {
    const rows = listAuditEvents(db, ALICE);
    expect(rows).toHaveLength(1);
    expect(rows[0].sessionId).toBe("s-alice");
    expect(rows[0].type).toBe("turn.settled");
  });
});
