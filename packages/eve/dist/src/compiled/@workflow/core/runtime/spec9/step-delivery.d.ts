import { type Event } from '#compiled/@workflow/world/index.js';
/**
 * What a background step's queue handler does with one delivery of the step's
 * message. The handler never replays the workflow; this is the whole decision
 * it makes before it runs a body.
 */
export type StepDeliveryDecision = 
/** Acknowledge the message without running the body. */
{
    action: 'ack';
    reason: 'step-terminal' | 'run-terminal';
}
/** Redeliver the same message after `timeoutSeconds`. */
 | {
    action: 'redeliver';
    timeoutSeconds: number;
    reason: 'retry-after';
}
/** Write `step_failed` for exceeding the retry budget, then acknowledge. */
 | {
    action: 'fail';
    attempt: number;
    reason: 'max-retries';
}
/**
 * Write `step_started` with this attempt, then run the body.
 * `firstStartedAt` is when the step's first attempt started, when the log
 * shows one: the step's `stepStartedAt` stays that of its first attempt.
 */
 | {
    action: 'run';
    attempt: number;
    firstStartedAt?: Date;
};
/**
 * Whether a delivery must read the run's full log before deciding.
 *
 * Only the first delivery of a message that marks neither a retry nor a
 * re-send may skip the read. Any other delivery may follow a committed
 * outcome whose response was lost, an invocation that died mid-body, or an
 * early redelivery, and only the log can tell those apart. A re-sent message
 * (`stepResent`) was sent from a log that may be older than the step's
 * progress: its first delivery may come after the step's outcome. A queue
 * that cannot report a delivery count gives `undefined`, which is treated as
 * "possibly a redelivery".
 */
export declare function stepDeliveryNeedsLogRead(params: {
    deliveryCount: number | undefined;
    stepAttempt: number | undefined;
    stepResent?: boolean;
}): boolean;
/**
 * The decision for a delivery that may skip the log read
 * ({@link stepDeliveryNeedsLogRead} returned false): the message's own attempt.
 */
export declare function firstDeliveryDecision(stepAttempt: number | undefined): StepDeliveryDecision;
/**
 * The decision for a delivery that read the run's full log. The rows of the
 * table, in order:
 *
 * | Log shows | Decision |
 * |---|---|
 * | a terminal event for the step | ack, no body |
 * | a terminal run event | ack, no body |
 * | the latest `step_retrying`'s `retryAfter` not reached | redeliver after the rest |
 * | attempt above `maxRetries + 1` | `step_failed`, ack |
 * | otherwise | `step_started` with attempt = starts + 1, run the body |
 *
 * Attempt is the number of `step_started` events for the step plus one. With
 * one live owner per step that count is exact, so a `maxRetries: 0` step
 * that already started once is failed instead of run again: at most once per
 * live owner. A duplicate delivery after a lease expiry is a second owner: if
 * it reads the log before the first `step_started` lands, both run the body.
 */
export declare function decideStepDelivery(params: {
    events: readonly Event[];
    stepId: string;
    maxRetries: number;
    nowMs: number;
}): StepDeliveryDecision;
/**
 * How long a background step's log may show no activity before a step
 * message past the delivery cap is taken to be stuck (see
 * {@link stepDeliveryStalled}). Far longer than the gaps a healthy step
 * leaves between its writes: a World redelivers a failed or deferred
 * delivery within minutes, a step body runs at most for its function's
 * deadline, and its start is written before the body runs. A World keeps
 * redelivering a failing step message at least this long
 * (`QUEUE_MIN_STEP_REDELIVERY_SPAN_MS`), so a stuck step is reached.
 */
export declare const STEP_DELIVERY_STALL_WINDOW_MS: number;
/**
 * Whether a step message delivered past the delivery cap is stuck: none of
 * its deliveries got as far as writing anything for a long while. True when
 * the step's last event (its creation, start or retry) is older than
 * `windowMs`, and no `step_retrying` names a `retryAfter` later than
 * `windowMs` ago (a retry that is pending, or whose time just came).
 *
 * A delivery that throws before it writes (its input cannot be read, say)
 * leaves the log as it was, so its message is redelivered until it expires
 * with the run still running. One that runs the body writes `step_started`
 * first, and one that is deferred (a retry not yet due, a throttled start)
 * follows a recent write or a pending `retryAfter`.
 */
export declare function stepDeliveryStalled(params: {
    events: readonly Event[];
    stepId: string;
    nowMs: number;
    windowMs?: number;
}): boolean;
//# sourceMappingURL=step-delivery.d.ts.map