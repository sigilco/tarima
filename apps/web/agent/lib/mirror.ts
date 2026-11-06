/**
 * Mirror seam (plan D13/D8): the eve hook in `agent/hooks/mirror.ts`
 * delegates here so the write path is unit-testable without the eve
 * runtime. Every function is total: it never throws, because a throwing
 * hook handler fails the turn.
 */
import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import { and, eq, like } from "drizzle-orm";
import { db } from "@tarima/api/db";
import { agentEvents, approvals, memoryJournal } from "@tarima/api/db/schema";
import { drainOutbox } from "@tarima/api/services/outreach-mail";

/**
 * JSON.stringify that survives eve payloads: undefined, bigint, Date,
 * cycles, and exotic values degrade to strings instead of throwing.
 */
export function safeJson(value: unknown): string {
  const seen = new WeakSet<object>();
  try {
    const out = JSON.stringify(value, (_key, v: unknown) => {
      if (typeof v === "bigint") return v.toString();
      if (typeof v === "function" || typeof v === "symbol") return String(v);
      if (v instanceof Date) return v.toISOString();
      if (v && typeof v === "object") {
        if (seen.has(v)) return "[circular]";
        seen.add(v);
      }
      return v;
    });
    return out ?? "{}";
  } catch {
    try {
      return JSON.stringify(String(value));
    } catch {
      return "{}";
    }
  }
}

/** safeJson parsed back: for drizzle columns declared `{ mode: "json" }`. */
function safeJsonRecord(value: unknown): Record<string, unknown> {
  try {
    return JSON.parse(safeJson(value)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export type MirrorContext = {
  session: { id: string; auth: { current: { principalId: string } | null } };
  position: { line: number; index: number };
};

/** Insert one eve fact into agent_events; idempotent on the fact position. */
export function mirrorFact(event: { type: string }, ctx: MirrorContext): void {
  try {
    db.insert(agentEvents)
      .values({
        sessionId: ctx.session.id,
        line: ctx.position.line,
        idx: ctx.position.index,
        type: event.type,
        principalId: ctx.session.auth.current?.principalId ?? null,
        payload: safeJsonRecord(event),
        createdAt: Date.now(),
      })
      .onConflictDoNothing()
      .run();
  } catch (err) {
    console.error("[eve-mirror] agent_events insert failed", err);
  }
}

/**
 * callId -> tool name/input, from `call.requested` facts. In-memory: the
 * facts arrive in the same process, and `call.requested` always precedes
 * the approval's `interaction.opened` on the stream. On a miss the
 * approvals mirror falls back to the mirrored `call.requested` row.
 */
const seenCalls = new Map<string, { name: string; input: unknown }>();

export function rememberCall(data: {
  callId: string;
  capability?: { name?: string };
  input?: unknown;
}): void {
  try {
    const name = data.capability?.name;
    if (!data.callId || !name) return;
    seenCalls.set(data.callId, { name, input: data.input });
    if (seenCalls.size > 1000) {
      const first = seenCalls.keys().next().value;
      if (first !== undefined) seenCalls.delete(first);
    }
  } catch {
    /* never throw */
  }
}

function toolNameForCall(sessionId: string, callId: string): string | undefined {
  const seen = seenCalls.get(callId);
  if (seen) return seen.name;
  try {
    const rows = db
      .select({ payload: agentEvents.payload })
      .from(agentEvents)
      .where(
        and(
          eq(agentEvents.sessionId, sessionId),
          eq(agentEvents.type, "call.requested"),
          like(agentEvents.payload, `%"callId":"${callId}"%`),
        ),
      )
      .limit(1)
      .all();
    const payload = rows[0]?.payload;
    const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
    const name = (parsed as { data?: { capability?: { name?: string } } })?.data?.capability?.name;
    return typeof name === "string" ? name : undefined;
  } catch {
    return undefined;
  }
}

export type InteractionOpenedData = {
  interactionId: string;
  subject: unknown;
  request: { kind: string; prompt: string; title?: string };
};

/** Record an approval interaction as pending; other kinds are ignored. */
export function mirrorInteractionOpened(data: InteractionOpenedData, ctx: MirrorContext): void {
  try {
    const { interactionId, subject, request } = data;
    if (request.kind !== "approval") return;
    const callId =
      typeof (subject as { callId?: unknown })?.callId === "string"
        ? ((subject as { callId: string }).callId as string)
        : null;
    const seen = callId ? seenCalls.get(callId) : undefined;
    db.insert(approvals)
      .values({
        id: nanoid(),
        sessionId: ctx.session.id,
        interactionId,
        toolName: (callId && toolNameForCall(ctx.session.id, callId)) || "unknown",
        callId,
        principalId: ctx.session.auth.current?.principalId ?? null,
        status: "pending",
        requestPayload: safeJsonRecord({ ...data, toolInput: seen?.input }),
        createdAt: Date.now(),
      })
      .onConflictDoNothing()
      .run();
  } catch (err) {
    console.error("[eve-mirror] approvals insert failed", err);
  }
}

export type InteractionSettledData = {
  interactionId: string;
  outcome: string;
  cause?: unknown;
};

/**
 * Memory write journal (plan W4, step 1 toward undo): record every
 * `save_memory` / `remove_memory` call the model makes through eve's
 * file-memory provider. Rows key on (session, line, idx) like
 * `agent_events`, so a retried hook step is a no-op.
 */
const MEMORY_TOOL_PATTERN = /^memory__(save|remove)_memory$/;

/** Record a memory tool call from a `call.requested` fact; others are ignored. */
export function rememberMemoryWrite(data: {
  callId: string;
  capability?: { name?: string };
  input?: unknown;
  sessionId: string;
  principalId: string | null;
  line: number;
  index: number;
}): void {
  try {
    const name = data.capability?.name;
    const match = name ? MEMORY_TOOL_PATTERN.exec(name) : null;
    if (!data.callId || !match) return;
    db.insert(memoryJournal)
      .values({
        sessionId: data.sessionId,
        line: data.line,
        idx: data.index,
        callId: data.callId,
        principalId: data.principalId,
        action: match[1] === "save" ? "save" : "remove",
        payload: safeJsonRecord(data.input),
        createdAt: Date.now(),
      })
      .onConflictDoNothing()
      .run();
  } catch (err) {
    console.error("[eve-mirror] memory_journal insert failed", err);
  }
}

const OUTCOME_STATUS: Record<string, string> = {
  accepted: "approved",
  declined: "denied",
  withdrawn: "cancelled",
  abandoned: "cancelled",
  interrupted: "cancelled",
  expired: "cancelled",
  invalid: "denied",
  failed: "denied",
};

/** Settle a pending approval row from interaction.settled. */
export function mirrorInteractionSettled(data: InteractionSettledData, ctx: MirrorContext): void {
  try {
    const { interactionId, outcome } = data;
    const status = OUTCOME_STATUS[outcome] ?? "cancelled";
    db.update(approvals)
      .set({
        status,
        decidedBy: ctx.session.auth.current?.principalId ?? null,
        decidedAt: Date.now(),
      })
      .where(eq(approvals.interactionId, interactionId))
      .run();
  } catch (err) {
    console.error("[eve-mirror] approvals update failed", err);
  }
}

/**
 * The idempotency key send_email computes from its input — the drain needs
 * the same derivation to find the row the approved call staged.
 */
function sendEmailKey(input: unknown): string | null {
  const i = input as { projectId?: string; to?: string; subject?: string; body?: string } | null;
  if (!i?.projectId || !i.to || !i.subject || !i.body) return null;
  return createHash("sha256")
    .update([i.projectId, i.to, i.subject, i.body].join("\n"))
    .digest("hex")
    .slice(0, 32);
}

/**
 * Outbox drain trigger (T3): a settled `send_email` call means its approval
 * was accepted and the tool staged its outbox row (`interaction.settled`
 * alone fires BEFORE the tool executes, so draining there would race the
 * stage — the drain hooks `call.settled` instead, which is the settle that
 * matters). Fire and forget: a throwing hook handler fails the turn, and a
 * slow provider must never hold the turn open.
 */
export function drainAfterSettledCall(data: { callId?: string; outcome?: string }): void {
  try {
    if (data.outcome !== "completed" || !data.callId) return;
    if (seenCalls.get(data.callId)?.name !== "send_email") return;
    const key = sendEmailKey(seenCalls.get(data.callId)?.input);
    void drainOutbox(key ? { idempotencyKey: key } : undefined).catch((err) =>
      console.error("[eve-mirror] outbox drain failed", err),
    );
  } catch (err) {
    console.error("[eve-mirror] outbox drain trigger failed", err);
  }
}
