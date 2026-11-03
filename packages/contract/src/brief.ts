/**
 * Event brief: the structured spec a tester gives a project. Stored inside
 * `projects.goal` under the namespaced key `brief` (`{ brief: {...} }`), so
 * rows written before the brief existed stay valid (`brief` is optional on
 * the goal record).
 */
import * as v from "valibot";

export const BRIEF_GOAL_KEY = "brief";

const shortText = (max: number) => v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(max));

export const sponsorsSchema = v.object({
  wanted: v.boolean(),
  tiers: v.optional(v.array(shortText(100))),
  deliverables: v.optional(v.array(shortText(200))),
});
export type Sponsors = v.InferOutput<typeof sponsorsSchema>;

export const briefSchema = v.object({
  eventType: shortText(100),
  city: shortText(100),
  /** One fixed day (YYYY-MM-DD). Use `window` when the date is flexible. */
  date: v.optional(v.pipe(v.string(), v.isoDate())),
  /** Flexible dates: inclusive range (YYYY-MM-DD). */
  window: v.optional(
    v.object({
      start: v.pipe(v.string(), v.isoDate()),
      end: v.pipe(v.string(), v.isoDate()),
    }),
  ),
  headcount: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100_000)),
  budgetAmount: v.pipe(v.number(), v.minValue(0)),
  /** ISO 4217, upper case (EUR, USD). */
  currency: v.pipe(v.string(), v.regex(/^[A-Z]{3}$/)),
  /** Free-text venue needs (AV, accessibility, catering, ...). */
  venueRequirements: v.optional(v.pipe(v.string(), v.maxLength(2000))),
  sponsors: v.optional(sponsorsSchema),
  /** Free-text notes from the form. */
  notes: v.optional(v.pipe(v.string(), v.maxLength(4000))),
});
export type Brief = v.InferOutput<typeof briefSchema>;

/**
 * Shape of `projects.goal`. Loose on purpose: the engine and older rows put
 * other keys in it; only `brief` is contract-owned here.
 */
export const projectGoalSchema = v.looseObject({
  [BRIEF_GOAL_KEY]: v.optional(briefSchema),
});
export type ProjectGoal = v.InferOutput<typeof projectGoalSchema>;
