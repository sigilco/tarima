/**
 * Notify payload: what an outbox `notify` effect carries, shared by the
 * engine (stream C produces) and the fanout service (stream B consumes).
 * Copy rule: `summary` front-loads the one line the user must see.
 */
import * as v from "valibot";

export const NOTIFY_KINDS = ["status_change", "approval_needed", "digest"] as const;
export const notifyKindSchema = v.picklist(NOTIFY_KINDS);
export type NotifyKind = v.InferOutput<typeof notifyKindSchema>;

export const notifyPayloadSchema = v.object({
  projectId: v.pipe(v.string(), v.uuid()),
  entityId: v.optional(v.pipe(v.string(), v.uuid())),
  kind: notifyKindSchema,
  /** Short plain text, no markdown, at most 280 chars. */
  summary: v.pipe(v.string(), v.minLength(1), v.maxLength(280)),
});
export type NotifyPayload = v.InferOutput<typeof notifyPayloadSchema>;

/** Channels a user can bind for notifications. */
export const BINDING_CHANNELS = ["telegram", "whatsapp"] as const;
export const bindingChannelSchema = v.picklist(BINDING_CHANNELS);
export type BindingChannel = v.InferOutput<typeof bindingChannelSchema>;

/** Connect codes: 6 chars, single use, 15 min TTL. */
export const CONNECT_CODE_TTL_SEC = 15 * 60;
export const connectCodeSchema = v.pipe(v.string(), v.regex(/^[A-Z0-9]{6}$/));

export const channelBindingSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  channel: bindingChannelSchema,
  label: v.optional(v.string()),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
});
export type ChannelBinding = v.InferOutput<typeof channelBindingSchema>;
