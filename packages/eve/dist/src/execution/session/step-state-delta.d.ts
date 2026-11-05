import type { SessionStateValues, WithSessionStateDelta } from "#execution/session/state-delta.js";
/**
 * Runs a session step's work and returns its result with the session values
 * it produced replaced by their delta from the values the step was given.
 *
 * Workflow replay reads every step's output but no step's input, so a step
 * that returns only what changed keeps both replay and storage from carrying
 * the whole session once per step. The workflow body applies the delta to the
 * values it passed in; see `applySessionStateDelta`.
 *
 * The input is snapshotted before `work` runs because step code may edit it
 * in place, as a channel adapter does with its state. A retried step's state
 * follows every line its interrupted attempt wrote; see
 * {@link followInterruptedAttempt}.
 */
export declare function withSessionStateDelta<I extends Partial<SessionStateValues>, R extends Partial<SessionStateValues>>(input: I, work: (input: I) => Promise<R>): Promise<WithSessionStateDelta<R>>;
