/**
 * Engine boot for the api process (Stage 4, T4.3).
 *
 * One place that wires the durable journal to real side effects:
 *
 *   - step handlers: the chase SFM registry, with an LLM provider built
 *     from the environment. Without `LLM_BASE_URL` the deterministic
 *     stub is used, so dev and CI boot LLM-free (a warning is logged
 *     once; boot never crashes on a missing provider).
 *   - outbox dispatch: the chase handlers emit side effects into the
 *     engine outbox (`email.send`, `whatsapp.send`, `entity.update`,
 *     `notify`, and the journaled `chase.*` effect echoes). The pump
 *     claims pending rows through `dispatchOutbox` and maps each type
 *     to the channels router or to a db write.
 *
 * `startEngine` is idempotent: a second call is a no-op, so tests and
 * the dev watcher can import this module freely.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { stubLlm, type ChaseLlm } from "@tarima/chase/llm";
import { dispatchOutbox, pendingOutbox, recoverExpiredLeases } from "@tarima/engine/journal";
import { startRunner } from "@tarima/engine/runner";
import { createLLM } from "@tarima/llm";
import type { NotifyPayload } from "@tarima/contract";
import { apiChaseHandlers } from "./chase-handlers";
import { channelsRouter } from "./channels";
import { db } from "./db";
import { entities, events, outbox, outreachMessages, workflows } from "./db/schema";
import { pushDigest } from "./telegram";
import { fanoutNotify, payloadFromEffect, type NotifySenders } from "./services/notify";
import { telegramSender, whatsappSender } from "./services/notify-channels";

/** Handle returned by `startEngine`; `stop` drains the loops. */
export interface EngineHandle {
  stop: () => Promise<void>;
}

const OUTBOX_PUMP_INTERVAL_MS = Number(process.env.ENGINE_OUTBOX_INTERVAL_MS ?? 2000);
const STEP_POLL_INTERVAL_MS = Number(process.env.ENGINE_STEP_POLL_MS ?? 250);
/** Failed sends before a row is dead-lettered (status `failed`). */
const MAX_SEND_ATTEMPTS = Number(process.env.ENGINE_MAX_SEND_ATTEMPTS ?? 5);

/** Effect types the dispatcher knows how to run. */
const KNOWN_EFFECTS = new Set(["email.send", "whatsapp.send", "entity.update", "notify"]);

/** The LLM the chase handlers draft and parse with. */
function resolveLlm(): ChaseLlm {
  if (!process.env.LLM_BASE_URL?.trim()) {
    console.warn(
      "[engine] LLM_BASE_URL not set: chase drafts and parsing run on the deterministic stub",
    );
    return stubLlm;
  }
  return createLLM(process.env);
}

/** Outbox row shape `dispatchOutbox` hands the sender. */
interface OutboxRow {
  idempotencyKey: string;
  type: string;
  payload: Record<string, unknown>;
}

/**
 * Run id out of an idempotency key shaped `chase:send:<runId>:<tag>`,
 * `chase:update:<runId>` or `chase:notify:<runId>`.
 */
function runIdFromKey(key: string): string | null {
  const parts = key.split(":");
  return parts.length >= 3 && parts[0] === "chase" ? parts[2] : null;
}

/** The entityId a run was created with, or null when unknown. */
function entityIdForRun(runId: string): string | null {
  const row = db.select().from(workflows).where(eq(workflows.id, runId)).get();
  const entityId = (row?.context as Record<string, unknown> | undefined)?.entityId;
  return typeof entityId === "string" ? entityId : null;
}

/**
 * Record a sent chase email in `outreach_messages`. The outbox
 * idempotency key doubles as the row id: the engine may re-emit the
 * same effect after a crash-recovery replay, and the insert is a no-op
 * then. The chase handlers never write `outreach_messages`, so this is
 * the single insert point for outbound rows.
 */
function recordOutboundMessage(effect: OutboxRow): void {
  const runId = runIdFromKey(effect.idempotencyKey);
  const entityId = runId ? entityIdForRun(runId) : null;
  if (!entityId) {
    console.warn("[engine] email.send without a resolvable entity:", effect.idempotencyKey);
    return;
  }
  const payload = effect.payload as { subject?: string; body?: string };
  db.insert(outreachMessages)
    .values({
      id: effect.idempotencyKey,
      entityId,
      direction: "outbound",
      subject: payload.subject ?? null,
      body: payload.body ?? "",
      sentAt: Date.now(),
    })
    .onConflictDoNothing()
    .run();
}

/**
 * Apply an `entity.update` effect: merge the parsed fields into the
 * entity's `result` JSON bag, stamp the chase-forward db status, and
 * journal an audit event.
 */
function applyEntityUpdate(effect: OutboxRow): void {
  const fields = (effect.payload.fields ?? {}) as Record<string, unknown>;
  const runId = runIdFromKey(effect.idempotencyKey);
  const entityId =
    (runId ? entityIdForRun(runId) : null) ??
    (typeof effect.payload.entityId === "string" ? effect.payload.entityId : null);
  if (!entityId || Object.keys(fields).length === 0) {
    console.warn(
      "[engine] entity.update without fields or a resolvable entity",
      effect.idempotencyKey,
    );
    return;
  }

  const row = db.select().from(entities).where(eq(entities.id, entityId)).get();
  if (!row) {
    console.warn("[engine] entity.update for a missing entity", entityId);
    return;
  }
  const result = { ...row.result, ...fields };
  db.update(entities)
    .set({ result, status: "updated", updatedAt: Date.now() })
    .where(eq(entities.id, entityId))
    .run();

  db.insert(events)
    .values({
      id: randomUUID(),
      actor: "engine",
      type: "entity.updated",
      subjectType: "entity",
      subjectId: entityId,
      data: { fields },
      createdAt: Date.now(),
    })
    .run();

  // A board status change is a notification: the user wants to know
  // without opening the board. The fanout never throws.
  void fanoutNotify(
    db,
    statusChangePayload(entityId, row.name, row.projectId, fields),
    notifySenders(),
  ).catch((err) => console.error("[engine] status change notify failed", err));
}

/**
 * The status-change notification of an updated entity. The copy
 * front-loads the news (the entity name and its new state) so the
 * reader sees the point in the first line.
 */
function statusChangePayload(
  entityId: string,
  entityName: string,
  projectId: string,
  fields: Record<string, unknown>,
): NotifyPayload {
  const changed = Object.keys(fields)[0];
  const value = changed ? fields[changed] : undefined;
  const detail = typeof value === "string" ? value : undefined;
  const summary = detail
    ? `${entityName}: ${changed} ${detail}`.slice(0, 280)
    : `${entityName}: updated`.slice(0, 280);
  return { projectId, entityId, kind: "status_change", summary };
}

/**
 * A `notify` effect: journal the audit event, then hand the payload to
 * the fanout service (in-app inbox + Telegram + WhatsApp). The chase
 * handler today emits only a run id; `payloadFromEffect` translates
 * that into a contract payload from the run's entity. The Telegram
 * digest push stays, so the chats bound for digests keep working.
 */
async function applyNotify(effect: OutboxRow): Promise<void> {
  const runId = runIdFromKey(effect.idempotencyKey) ?? String(effect.payload.runId ?? "");
  const entityId = runId ? entityIdForRun(runId) : null;
  db.insert(events)
    .values({
      id: randomUUID(),
      actor: "engine",
      type: "chase.notified",
      subjectType: "entity",
      subjectId: entityId ?? runId,
      data: { runId },
      createdAt: Date.now(),
    })
    .run();
  if (entityId) {
    const entity = db.select().from(entities).where(eq(entities.id, entityId)).get();
    if (entity) {
      await pushDigest(entity.projectId);
      const payload =
        payloadFromEffect(db, {
          payload: { ...effect.payload, entityId, projectId: entity.projectId },
        }) ?? null;
      if (payload) await fanoutNotify(db, payload, notifySenders());
    }
  }
}

/**
 * The channels a notification fans out to. A channel without
 * configuration simply has no binding rows, so the loop over the
 * bindings delivers nothing for it.
 */
function notifySenders(): NotifySenders {
  return { telegram: telegramSender, whatsapp: whatsappSender };
}

/**
 * Failed sends per idempotency key. The outbox table has no attempt
 * column, so the counter lives in memory: a restart resets it and the
 * row gets another `MAX_SEND_ATTEMPTS` rounds.
 */
const attempts = new Map<string, number>();

/**
 * The outbox dispatcher, matching `dispatchOutbox`'s sender seam: return
 * on success (the row is marked sent), throw to keep the row pending
 * (the next sweep retries it).
 */
async function dispatchEffect(effect: OutboxRow): Promise<void> {
  try {
    switch (effect.type) {
      case "email.send": {
        const payload = effect.payload as { to?: string; subject?: string; body?: string };
        if (!payload.to) throw new Error('email.send payload without "to"');
        const result = await channelsRouter().send({
          channel: "email",
          to: payload.to,
          subject: payload.subject,
          text: payload.body ?? "",
        });
        if (!result.accepted) throw new Error(result.reason ?? "email send refused");
        recordOutboundMessage(effect);
        return;
      }
      case "whatsapp.send": {
        const payload = effect.payload as { to?: string; body?: string };
        if (!payload.to) throw new Error('whatsapp.send payload without "to"');
        const result = await channelsRouter().send({
          channel: "whatsapp",
          to: payload.to,
          text: payload.body ?? "",
        });
        if (!result.accepted) throw new Error(result.reason ?? "whatsapp send refused");
        return;
      }
      case "entity.update":
        applyEntityUpdate(effect);
        return;
      case "notify":
        await applyNotify(effect);
        return;
      default:
        if (effect.type.startsWith("chase.")) {
          // SFM effect echoes: the state machine already journaled
          // them, the dispatch is a no-op.
          return;
        }
        throw new Error(`unknown outbox effect type "${effect.type}"`);
    }
  } catch (err) {
    const key = effect.idempotencyKey;
    attempts.set(key, (attempts.get(key) ?? 0) + 1);
    console.error(
      `[engine] outbox effect ${effect.type} failed (attempt ${attempts.get(key)}):`,
      err instanceof Error ? err.message : err,
    );
    throw err;
  }
}

/**
 * Dead-letter pass. Two kinds of rows leave the pending set as
 * `failed`:
 *   - unknown effect types: no dispatcher will ever run them
 *   - sends that failed `MAX_SEND_ATTEMPTS` times: the provider keeps
 *     refusing, retrying forever would hide the failure
 */
function deadLetterUnrunnable(): void {
  for (const row of pendingOutbox(db)) {
    const unknown = !KNOWN_EFFECTS.has(row.type) && !row.type.startsWith("chase.");
    const exhausted = (attempts.get(row.idempotencyKey) ?? 0) >= MAX_SEND_ATTEMPTS;
    if (!unknown && !exhausted) continue;
    if (!unknown) {
      console.error(
        `[engine] outbox effect ${row.type} exhausted ${MAX_SEND_ATTEMPTS} attempts, dead-lettering`,
      );
    } else {
      console.error("[engine] unknown outbox effect type, dead-lettering:", row.type);
    }
    db.update(outbox).set({ status: "failed" }).where(eq(outbox.id, row.id)).run();
    attempts.delete(row.idempotencyKey);
  }
}

let running: EngineHandle | undefined;

/**
 * Start the engine loops in this process: the lease-claim step runner
 * and the outbox pump, after a boot-time lease recovery sweep (the
 * runner also sweeps on boot; this makes the intent explicit).
 * Idempotent: a second call returns the existing handle.
 */
export function startEngine(): EngineHandle {
  if (running) return running;

  recoverExpiredLeases(db);

  const runner = startRunner(db, apiChaseHandlers(resolveLlm()), {
    pollIntervalMs: STEP_POLL_INTERVAL_MS,
    workerId: `api-${process.pid}`,
  });

  let pumping = false;
  const pump = async (): Promise<void> => {
    if (pumping) return;
    pumping = true;
    try {
      deadLetterUnrunnable();
      await dispatchOutbox(db, dispatchEffect);
    } catch (err) {
      console.error("[engine] outbox pump failed", err);
    } finally {
      pumping = false;
    }
  };

  const timer = setInterval(() => void pump(), OUTBOX_PUMP_INTERVAL_MS);
  timer.unref?.();
  void pump();

  running = {
    stop: async () => {
      clearInterval(timer);
      await runner.stop();
      running = undefined;
    },
  };
  return running;
}
