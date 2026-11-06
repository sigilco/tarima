/**
 * GTM contacts: the consent/suppression list behind founder-led outreach.
 *
 * One row per contactable person (a pilot lead, a sponsor contact, a
 * venue manager). The table exists so outreach can answer two questions
 * before anything is sent: did this person consent, and have they asked
 * us to stop. `doNotContact` is the suppression flag — when it is set
 * the contact must never be contacted, on any channel, by anyone.
 *
 * Wire timestamps are ISO strings; the db stores epoch ms.
 */
import * as v from "valibot";

const shortText = (max: number) => v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(max));

/** Where a contact came from: "manual", "import", "tally", "calcom", ... */
export const gtmContactSourceSchema = shortText(100);
export type GtmContactSource = v.InferOutput<typeof gtmContactSourceSchema>;

export const gtmContactSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  /** Lower-cased on write; the unique key of the table. */
  email: v.pipe(v.string(), v.email()),
  name: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(200))),
  source: gtmContactSourceSchema,
  /** Recorded opt-in: true only when the contact consented to outreach. */
  consent: v.boolean(),
  /** Suppression flag: when true the contact must never be contacted. */
  doNotContact: v.boolean(),
  doNotContactReason: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(500)))),
  /** Optional project the contact is attached to. */
  projectId: v.optional(v.nullable(v.pipe(v.string(), v.uuid()))),
  notes: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(4000)))),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  updatedAt: v.pipe(v.string(), v.isoTimestamp()),
});
export type GtmContact = v.InferOutput<typeof gtmContactSchema>;

/**
 * Create-or-update by email. Fields left out keep their stored values;
 * `doNotContact` is never cleared by an upsert — suppression is only
 * lifted through `setGtmDoNotContactSchema`.
 */
export const upsertGtmContactSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email()),
  name: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(200))),
  source: v.optional(gtmContactSourceSchema),
  consent: v.optional(v.boolean()),
  projectId: v.optional(v.nullable(v.pipe(v.string(), v.uuid()))),
  notes: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(4000)))),
});
export type UpsertGtmContact = v.InferInput<typeof upsertGtmContactSchema>;

export const setGtmConsentSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email()),
  consent: v.boolean(),
});
export type SetGtmConsent = v.InferInput<typeof setGtmConsentSchema>;

export const setGtmDoNotContactSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email()),
  doNotContact: v.boolean(),
  reason: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(500)))),
});
export type SetGtmDoNotContact = v.InferInput<typeof setGtmDoNotContactSchema>;
