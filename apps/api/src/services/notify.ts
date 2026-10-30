/**
 * Notify fanout (Stage B, channels stream).
 *
 * One notification goes to three places: the in-app inbox, every
 * Telegram chat the user bound, and every WhatsApp number the user
 * bound. The fanout is the only place that knows this fan shape, so
 * the engine just hands over a `notify` payload (contract
 * `notifyPayloadSchema`) and the channels decide how to deliver it.
 *
 * Copy rule (Instinct): the first line is the important one. The
 * payload's `summary` is that line, and it is delivered unchanged: no
 * prefix, no "Tarima:" label, nothing that pushes the news down.
 *
 * Failure policy: a channel that refuses (a dead phone number, a chat
 * that blocked the bot) is counted and logged, never thrown. The
 * in-app copy is written first, so the user always has the message even
 * when every channel fails.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { notifyPayloadSchema, type BindingChannel, type NotifyPayload } from "@tarima/contract";
import type { ApiDb } from "./projects";
import { entities, projects, userMessages } from "../db/schema";
import { boundExternalIds } from "./bindings";

/** A channel that can carry a message to one endpoint. */
export interface NotifySender {
  /** Deliver the text to the endpoint (a chat id or a phone number). */
  send(externalId: string, text: string): Promise<void>;
}

/** The senders the fanout may use, one per bound channel. */
export type NotifySenders = Partial<Record<BindingChannel, NotifySender>>;

/** What the fanout did. */
export interface FanoutResult {
  /** The in-app copy was written. */
  inApp: boolean;
  /** Endpoints that accepted the message. */
  delivered: number;
  /** Endpoints that refused it. */
  failed: number;
}

/** The user a project belongs to, or null when it has no owner. */
export function projectOwner(db: ApiDb, projectId: string): string | null {
  const row = db
    .select({ ownerId: projects.ownerId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .get();
  return row?.ownerId ?? null;
}

/**
 * Write the in-app copy of a notification. The unread counter is the
 * count of rows with `read_at IS NULL` for that user.
 */
export function storeInAppMessage(db: ApiDb, userId: string, payload: NotifyPayload): void {
  db.insert(userMessages)
    .values({
      id: randomUUID(),
      userId,
      projectId: payload.projectId,
      kind: payload.kind,
      summary: payload.summary,
    })
    .run();
}

/**
 * Fan a notification out to the user's in-app inbox and to every
 * channel they bound. The project's owner is the recipient: a project
 * without an owner has nobody to notify.
 */
export async function fanoutNotify(
  db: ApiDb,
  payload: NotifyPayload,
  senders: NotifySenders,
): Promise<FanoutResult> {
  const userId = projectOwner(db, payload.projectId);
  if (!userId) {
    console.warn("[notify] project without owner, dropped:", payload.projectId);
    return { inApp: false, delivered: 0, failed: 0 };
  }

  storeInAppMessage(db, userId, payload);

  let delivered = 0;
  let failed = 0;

  for (const channel of Object.keys(senders) as BindingChannel[]) {
    const sender = senders[channel];
    if (!sender) continue;

    for (const externalId of boundExternalIds(db, userId, channel)) {
      try {
        await sender.send(externalId, payload.summary);
        delivered += 1;
      } catch (error) {
        failed += 1;
        console.error(
          `[notify] ${channel} send to ${externalId} failed:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  return { inApp: true, delivered, failed };
}

/**
 * Build a notify payload from an outbox effect. The contract shape is
 * the contract (`notifyPayloadSchema`); an effect that carries only a
 * run id (the chase handler's shape today) is translated into a
 * status-change payload from the run's entity, so the fanout always has
 * something to deliver.
 */
export function payloadFromEffect(
  db: ApiDb,
  effect: { payload: Record<string, unknown> },
): NotifyPayload | null {
  const parsed = v.safeParse(notifyPayloadSchema, effect.payload);
  if (parsed.success) return parsed.output;

  const entityId = typeof effect.payload.entityId === "string" ? effect.payload.entityId : null;
  if (!entityId) return null;

  const entity = db.select().from(entities).where(eq(entities.id, entityId)).get();
  if (!entity) return null;

  return {
    projectId: entity.projectId,
    entityId: entity.id,
    kind: "status_change",
    summary: `${entity.name}: ${entity.status}`.slice(0, 280),
  };
}
