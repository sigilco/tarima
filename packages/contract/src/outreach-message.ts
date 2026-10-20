/** Outreach message: one outbound/inbound leg in a row's timeline. */
import * as v from "valibot";
import { channelSchema } from "./chase.js";

export const messageDirectionSchema = v.picklist(["outbound", "inbound"] as const);
export type MessageDirection = v.InferOutput<typeof messageDirectionSchema>;

export const outreachMessageSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  entityId: v.pipe(v.string(), v.uuid()),
  direction: messageDirectionSchema,
  channel: channelSchema,
  subject: v.optional(v.pipe(v.string(), v.maxLength(300))),
  body: v.pipe(v.string(), v.maxLength(50_000)),
  /** Engine-assigned draft revision for outbound messages (draft#3 in the screens). */
  draftNumber: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
  /** LLM parse result for inbound replies, when parsed. */
  parsedIntent: v.optional(v.string()),
  sentAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
  receivedAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
});
export type OutreachMessage = v.InferOutput<typeof outreachMessageSchema>;
