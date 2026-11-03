/**
 * Channel bindings (Stage B, channels stream).
 *
 * One row per bound channel endpoint: a Telegram chat id or a WhatsApp
 * phone number, attached to the user that proved ownership by sending a
 * connect code. The `(channel, external_id)` pair is unique, so
 * rebinding an endpoint moves it to the new user (the last code wins),
 * which is also the recovery path for a lost account.
 */
import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import type { BindingChannel } from "@tarima/contract";
import type { ApiDb } from "./projects";
import { channelBindings } from "../db/schema";

/** The wire shape of a binding (contract `channelBindingSchema`). */
export interface BindingWire {
  id: string;
  channel: BindingChannel;
  label: string | null;
  externalId: string;
  createdAt: string;
}

function toWire(row: typeof channelBindings.$inferSelect): BindingWire {
  return {
    id: row.id,
    channel: row.channel,
    label: row.label,
    externalId: row.externalId,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

/** Every channel the user has bound, oldest first (stable list). */
export function listBindings(db: ApiDb, userId: string): BindingWire[] {
  return db
    .select()
    .from(channelBindings)
    .where(eq(channelBindings.userId, userId))
    .orderBy(asc(channelBindings.createdAt))
    .all()
    .map(toWire);
}

/** The endpoints bound to a user on one channel (external ids only). */
export function boundExternalIds(db: ApiDb, userId: string, channel: BindingChannel): string[] {
  return db
    .select({ externalId: channelBindings.externalId })
    .from(channelBindings)
    .where(and(eq(channelBindings.userId, userId), eq(channelBindings.channel, channel)))
    .all()
    .map((row) => row.externalId);
}

export interface BindInput {
  userId: string;
  channel: BindingChannel;
  externalId: string;
  label?: string | null;
}

/**
 * Bind an endpoint to a user. Idempotent per (channel, externalId):
 * rebinding the same endpoint updates the owner and label instead of
 * failing on the unique index.
 */
export function bindChannel(db: ApiDb, input: BindInput): BindingWire {
  const now = Date.now();
  const existing = db
    .select()
    .from(channelBindings)
    .all()
    .find((row) => row.channel === input.channel && row.externalId === input.externalId);

  if (existing) {
    db.update(channelBindings)
      .set({ userId: input.userId, label: input.label ?? existing.label })
      .where(eq(channelBindings.id, existing.id))
      .run();
    return toWire({ ...existing, userId: input.userId, label: input.label ?? existing.label });
  }

  const row: typeof channelBindings.$inferSelect = {
    id: randomUUID(),
    userId: input.userId,
    channel: input.channel,
    externalId: input.externalId,
    label: input.label ?? null,
    createdAt: now,
  };
  db.insert(channelBindings).values(row).run();
  return toWire(row);
}

/** Drop one binding of a user. Unknown ids are a no-op (idempotent unbind). */
export function unbindChannel(db: ApiDb, userId: string, bindingId: string): void {
  db.delete(channelBindings)
    .where(and(eq(channelBindings.id, bindingId), eq(channelBindings.userId, userId)))
    .run();
}
