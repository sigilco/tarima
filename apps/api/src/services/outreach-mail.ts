/**
 * Outbound outreach mail (tickets T3-T5): the drain that turns a staged
 * `outbox` row into a real send, plus the compliance surface every
 * outbound body must carry.
 *
 * Flow: the agent's `send_email` tool stages a row (`status: "staged"`,
 * `type: "agent.email"`); once the approval settles and the tool call
 * completes, the mirror calls `drainOutbox`, which:
 *   1. refuses suppressed recipients (T4's opt-out table),
 *   2. renders the compliance footer (identity block, postal address,
 *      opt-out line — CAN-SPAM; see docs/handoff/context/tarima-gtm.md),
 *   3. sets Reply-To `rfq+<entityId>@<OUTREACH_REPLY_DOMAIN>` so replies
 *      thread back to the entity (T5),
 *   4. sends through the email adapter and flips the row to sent/failed,
 *      storing the provider Message-ID in the payload for threading,
 *   5. records the outbound copy in `outreach_messages` and emits an
 *      `events` row for the board.
 */
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { entities, events, outbox, outreachMessages, outreachSuppressions } from "../db/schema";
import { outreachEmailAdapter } from "../channels";

/** The staged payload `send_email` writes into outbox.payload. */
export interface OutreachPayload {
  projectId?: string;
  to?: string;
  subject?: string;
  body?: string;
  entityId?: string;
  stagedBy?: string;
  replyTo?: string;
  messageId?: string;
  error?: string;
  [key: string]: unknown;
}

/** The reply domain for plus-addressed entity threading. */
export function outreachReplyDomain(): string {
  return process.env.OUTREACH_REPLY_DOMAIN ?? "outreach.tarima.events";
}

/** Reply-To an entity's drained mail carries (T5). */
export function rfqReplyTo(entityId: string): string {
  return `rfq+${entityId}@${outreachReplyDomain()}`;
}

/** Decode an entity id back out of a reply address (`rfq+<id>` or `rfq-<id>`). */
export function decodeRfqEntity(address: string | undefined): string | null {
  if (!address) return null;
  const match = address.match(/([A-Za-z0-9._%+-]+)@/) ?? [null, address.trim()];
  const local = match[1] ?? "";
  const rfq = /^rfq[+-](.+)$/i.exec(local);
  return rfq?.[1] ?? null;
}

/**
 * Compliance footer (T4): identity block + postal address + opt-out line,
 * appended to every drained body. The postal address is required by
 * CAN-SPAM for commercial mail; it comes from OUTREACH_POSTAL_ADDRESS so
 * it is never hard-coded into a commit.
 */
export function renderOutreachBody(body: string): string {
  const identity = process.env.OUTREACH_IDENTITY ?? "Tarima venue outreach";
  const postal = process.env.OUTREACH_POSTAL_ADDRESS ?? "(postal address pending configuration)";
  return `${body}\n\n-- \n${identity}\n${postal}\nDon't want these emails? Reply "stop" or write to unsubscribe@${outreachReplyDomain()} and we will remove you.`;
}

/** True when the address is on the opt-out list. */
export function isSuppressed(email: string): boolean {
  const rows = db
    .select({ id: outreachSuppressions.id })
    .from(outreachSuppressions)
    .where(eq(outreachSuppressions.email, email.trim().toLowerCase()))
    .limit(1)
    .all();
  return rows.length > 0;
}

/** Add an address to the opt-out list (idempotent on the email). */
export function suppressEmail(email: string, reason?: string, source = "manual"): void {
  db.insert(outreachSuppressions)
    .values({
      id: randomUUID(),
      email: email.trim().toLowerCase(),
      reason: reason ?? null,
      source,
      createdAt: Date.now(),
    })
    .onConflictDoNothing()
    .run();
}

/** Resolve the entity a staged send belongs to: the explicit payload
 * entityId, else the project entity whose contact email is the recipient. */
function resolveEntityId(payload: OutreachPayload): string | null {
  if (payload.entityId) return payload.entityId;
  if (!payload.projectId || !payload.to) return null;
  const rows = db
    .select({ id: entities.id })
    .from(entities)
    .where(and(eq(entities.projectId, payload.projectId), eq(entities.contactEmail, payload.to)))
    .limit(1)
    .all();
  return rows[0]?.id ?? null;
}

function emitEvent(type: string, subjectId: string, data: Record<string, unknown>): void {
  db.insert(events)
    .values({
      id: randomUUID(),
      actor: "system",
      type,
      subjectType: "entity",
      subjectId,
      data,
      createdAt: Date.now(),
    })
    .run();
}

export type DrainResult = {
  drained: number;
  sent: number;
  failed: number;
  suppressed: number;
};

/**
 * Drain staged `agent.email` outbox rows through the provider. With
 * `filter` the drain is scoped to one row (the mirror drains exactly the
 * row its tool call staged); without it every staged row goes.
 */
export async function drainOutbox(filter?: { idempotencyKey?: string }): Promise<DrainResult> {
  const result: DrainResult = { drained: 0, sent: 0, failed: 0, suppressed: 0 };
  const rows = db
    .select()
    .from(outbox)
    .where(
      and(
        eq(outbox.type, "agent.email"),
        eq(outbox.status, "staged"),
        ...(filter?.idempotencyKey ? [eq(outbox.idempotencyKey, filter.idempotencyKey)] : []),
      ),
    )
    .all();

  for (const row of rows) {
    result.drained += 1;
    const payload = (row.payload ?? {}) as OutreachPayload;
    const to = payload.to ?? "";
    const subject = payload.subject ?? "(no subject)";
    const body = payload.body ?? "";
    const fail = (reason: string) => {
      result.failed += 1;
      db.update(outbox)
        .set({ status: "failed", payload: { ...payload, error: reason } })
        .where(eq(outbox.id, row.id))
        .run();
      if (payload.projectId) emitEvent("outreach.email_failed", row.id, { to, reason });
    };

    if (!to) {
      fail("missing recipient");
      continue;
    }
    if (isSuppressed(to)) {
      result.suppressed += 1;
      fail("recipient is on the suppression list");
      continue;
    }

    const entityId = resolveEntityId(payload);
    const replyTo = entityId ? rfqReplyTo(entityId) : undefined;
    const sendResult = await outreachEmailAdapter().send({
      channel: "email",
      to,
      subject,
      text: renderOutreachBody(body),
      ...(replyTo ? { replyTo } : {}),
    });

    if (!sendResult.accepted) {
      fail(sendResult.reason ?? "provider refused the send");
      continue;
    }

    result.sent += 1;
    db.update(outbox)
      .set({
        status: "sent",
        sentAt: Date.now(),
        payload: {
          ...payload,
          messageId: sendResult.externalId,
          ...(replyTo ? { replyTo } : {}),
          provider: sendResult.provider,
        },
      })
      .where(eq(outbox.id, row.id))
      .run();

    if (entityId) {
      db.insert(outreachMessages)
        .values({
          id: randomUUID(),
          entityId,
          direction: "outbound",
          subject,
          body,
          sentAt: Date.now(),
          createdAt: Date.now(),
        })
        .run();
      emitEvent("outreach.email_sent", entityId, {
        to,
        subject,
        provider: sendResult.provider,
        messageId: sendResult.externalId,
      });
    }
  }

  return result;
}
