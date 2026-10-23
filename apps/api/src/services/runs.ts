/**
 * Run lookup helpers for inbound messages.
 *
 * An inbound message (an email reply, a WhatsApp message) has to be
 * attached to the chase run that is waiting for it. The run context is
 * the only place that carries the contact coordinates of a row, so the
 * lookup reads the `workflows.context` JSON bag of the chase-deliverables
 * runs that are still `running`.
 *
 * Resolution rules (pragmatic, and documented on the webhook routes):
 *   - email: `context.contactEmail` equals the inbound `to` address
 *   - whatsapp: `context.contactPhone` equals the inbound `from` number
 *   - the newest matching run wins
 *
 * When nothing matches the caller logs the message as unassigned: an
 * `outreach_messages` row needs an entity, so there is nothing to
 * record it on, and no step is enqueued.
 *
 * The scan runs over all running chase runs in JS (the context is a
 * JSON column); fine at board scale, revisit when a project has
 * thousands of concurrent runs.
 */
import { and, desc, eq, like, sql } from "drizzle-orm";
import { CHASE_DELIVERABLES } from "@tarima/chase/template";
import { enqueueStep } from "@tarima/engine/journal";
import { steps, workflows } from "../db/schema";
import type { ApiDb } from "./projects";

/** The step key that consumes an inbound reply body. */
const CHASE_PARSE_STEP = "chase.parse";

/** A run that is waiting for an inbound message. */
export interface ActiveRun {
  runId: string;
  entityId: string | null;
  context: Record<string, unknown>;
}

export interface ContactLookup {
  /** Which channel the inbound message came from. */
  channel: "email" | "whatsapp";
  /**
   * The thread identifier: the address the message was sent to (email) or
   * the number it came from (whatsapp).
   */
  threadId: string;
  /**
   * The sender of the message. A reply comes FROM the contact we chased,
   * so the sender is the address that identifies the row. The thread
   * address is our own (a reply-to alias), so it matches nothing.
   */
  from?: string;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Strip the punctuation WhatsApp numbers carry on the wire. */
function normalizePhone(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function contextContact(context: Record<string, unknown>, channel: "email" | "whatsapp"): string {
  const raw =
    channel === "email" ? context.contactEmail : (context.contactPhone ?? context.contact);
  return typeof raw === "string" ? raw : "";
}

/**
 * The newest running chase-deliverables run whose context matches the
 * inbound message, or null when there is none.
 *
 * A reply identifies its row by its SENDER: we wrote to the contact, so
 * the answer comes back from them. The thread address (the `to` of the
 * inbound message) is our own reply-to alias and identifies nothing, so
 * the sender is what we match on. The thread id is still accepted as a
 * fallback for providers that only carry the thread.
 */
export function findActiveRunForContact(
  db: ApiDb,
  { channel, threadId, from }: ContactLookup,
): ActiveRun | null {
  const normalize = channel === "email" ? normalizeEmail : normalizePhone;
  const needles = [from, threadId]
    .map((value) => (typeof value === "string" ? normalize(value) : ""))
    .filter((value) => value.length > 0);
  if (needles.length === 0) return null;

  const rows = db
    .select()
    .from(workflows)
    .where(and(eq(workflows.type, CHASE_DELIVERABLES.type), eq(workflows.status, "running")))
    .orderBy(desc(workflows.createdAt))
    .all();

  for (const row of rows) {
    const context = (row.context ?? {}) as Record<string, unknown>;
    const contact = contextContact(context, channel);
    if (!contact) continue;
    if (!needles.includes(normalize(contact))) continue;
    return {
      runId: row.id,
      entityId: typeof context.entityId === "string" ? context.entityId : null,
      context,
    };
  }

  return null;
}

/**
 * Enqueue the `chase.parse` step on a run so the engine consumes the
 * inbound body. Returns the step id, or null when the step could not be
 * enqueued (the caller logs it and answers 200 anyway).
 */
export function enqueueParseStep(db: ApiDb, runId: string, body: string): string | null {
  // Step keys are unique per run (the engine's journal constraint); a
  // second reply while a parse step is still pending gets a '#n' suffix,
  // which the runner strips when resolving the handler.
  try {
    return enqueueStep(db, runId, CHASE_PARSE_STEP, { body });
  } catch {
    try {
      const [{ count }] = db
        .select({ count: sql<number>`count(*)` })
        .from(steps)
        .where(and(eq(steps.runId, runId), like(steps.stepKey, `${CHASE_PARSE_STEP}%`)))
        .all();
      return enqueueStep(db, runId, `${CHASE_PARSE_STEP}#${count + 1}`, { body });
    } catch (err) {
      console.error("[runs] could not enqueue parse step", err);
      return null;
    }
  }
}
