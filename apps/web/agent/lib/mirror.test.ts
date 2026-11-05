import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@tarima/api/db";
import { agentEvents, approvals } from "@tarima/api/db/schema";
import {
  mirrorFact,
  mirrorInteractionOpened,
  mirrorInteractionSettled,
  rememberCall,
  safeJson,
} from "./mirror";

const ctx = (line = 1, index = 0) => ({
  session: { id: "sess-test", auth: { current: { principalId: "user-1" } } },
  position: { line, index },
});

describe("safeJson", () => {
  it("serializes plain values", () => {
    expect(safeJson({ a: 1 })).toBe('{"a":1}');
  });
  it("degrades bigint, undefined-only objects, and functions", () => {
    expect(safeJson({ n: 10n })).toBe('{"n":"10"}');
    expect(safeJson({ f: () => 1 })).toBe('{"f":"() => 1"}');
    expect(safeJson(undefined)).toBe("{}");
  });
  it("serializes Dates as ISO", () => {
    expect(safeJson({ d: new Date("2026-01-01T00:00:00Z") })).toContain("2026-01-01");
  });
  it("never throws on cycles", () => {
    const a: Record<string, unknown> = {};
    a.self = a;
    expect(safeJson(a)).toBe('{"self":"[circular]"}');
  });
});

describe("mirrorFact", () => {
  it("inserts a fact and is idempotent on (session, line, idx)", () => {
    const c = ctx(10, 2);
    mirrorFact({ type: "turn.started" }, c);
    mirrorFact({ type: "turn.started" }, c);
    const rows = db.select().from(agentEvents).where(eq(agentEvents.sessionId, "sess-test")).all();
    const mine = rows.filter((r) => r.line === 10 && r.idx === 2);
    expect(mine).toHaveLength(1);
    expect(mine[0].type).toBe("turn.started");
    expect(mine[0].principalId).toBe("user-1");
  });
});

describe("approvals mirror", () => {
  it("records pending on interaction.opened and settles on interaction.settled", () => {
    rememberCall({ callId: "call-1", capability: { name: "send_email" }, input: { to: "x" } });
    const c = ctx(20, 0);
    mirrorInteractionOpened(
      {
        interactionId: "int-1",
        subject: { callId: "call-1" },
        request: { kind: "approval", prompt: "Approve send_email?" },
      },
      c,
    );
    const pending = db.select().from(approvals).where(eq(approvals.interactionId, "int-1")).all();
    expect(pending).toHaveLength(1);
    expect(pending[0].status).toBe("pending");
    expect(pending[0].toolName).toBe("send_email");
    expect(pending[0].callId).toBe("call-1");

    mirrorInteractionSettled({ interactionId: "int-1", outcome: "accepted" }, ctx(21, 0));
    const settled = db.select().from(approvals).where(eq(approvals.interactionId, "int-1")).all();
    expect(settled[0].status).toBe("approved");
    expect(settled[0].decidedBy).toBe("user-1");
    expect(settled[0].decidedAt).not.toBeNull();
  });

  it("ignores non-approval interactions", () => {
    mirrorInteractionOpened(
      {
        interactionId: "int-q",
        subject: {},
        request: { kind: "question", prompt: "Which color?" },
      },
      ctx(22, 0),
    );
    const rows = db.select().from(approvals).where(eq(approvals.interactionId, "int-q")).all();
    expect(rows).toHaveLength(0);
  });

  it("maps declined and withdrawn outcomes", () => {
    mirrorInteractionOpened(
      {
        interactionId: "int-2",
        subject: { callId: "call-2" },
        request: { kind: "approval", prompt: "Approve?" },
      },
      ctx(23, 0),
    );
    mirrorInteractionSettled({ interactionId: "int-2", outcome: "declined" }, ctx(24, 0));
    const rows = db.select().from(approvals).where(eq(approvals.interactionId, "int-2")).all();
    expect(rows[0].status).toBe("denied");
    expect(rows[0].toolName).toBe("unknown");
  });
});
