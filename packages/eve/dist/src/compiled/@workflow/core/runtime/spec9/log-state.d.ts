import type { Event, SerializedData } from '#compiled/@workflow/world/index.js';
/**
 * Upper bound on a step input carried on its queue message. Larger inputs are
 * read back from the step's `step_created` by the step's invocation. Staying
 * under the queue's inline threshold keeps step messages on its fast path.
 */
export declare const MAX_STEP_MESSAGE_INPUT_BYTES: number;
/** A background step message to enqueue. */
export interface StepMessageSpec {
    correlationId: string;
    stepName: string;
    stepCreatedEventId?: string;
    /**
     * When the step's `step_created` was committed (its `createdAt`), for a
     * background step's first message. Re-sends carry the creation's time, not
     * the re-send's. Sent only when the message starts at attempt 1.
     */
    stepCreatedAt?: Date;
    input?: SerializedData;
    stepAttempt?: number;
    /**
     * A re-send (see `stepsToReenqueue`): its message is marked, so that its
     * handler reads the log before it runs the body.
     */
    resent?: boolean;
}
/** An inline step to run in this process. */
export interface InlineStepSpec {
    correlationId: string;
    stepName: string;
    input?: SerializedData;
    createdEventId?: string;
    attempt: number;
    firstStartedAt?: Date;
    /**
     * The step's creation-bearing `step_started`, when the orchestrator wrote
     * it (its creation batch). The executor then writes no start.
     */
    started?: {
        startedAt: Date;
        postSentAtMs?: number;
        completedAtMs?: number;
    };
    /** The World's refusal of that creation-bearing start. */
    startRefusal?: Error;
    /**
     * Settles once the step's creation committed, when the body starts while
     * that commit is in flight (turbo), with its creation-bearing start.
     * Otherwise its `step_started` waits for it.
     */
    startAfter?: Promise<{
        startedAt: Date;
        postSentAtMs?: number;
        completedAtMs?: number;
    } | undefined>;
}
/** What the log says about one step. */
export interface LogStepState {
    correlationId: string;
    stepName: string;
    createdEventId: string;
    /** The `createdAt` of the step's `step_created`; absent for an inline
     *  step, which a `step_started` creates. */
    createdAt?: Date;
    inline: boolean;
    starts: number;
    /** When the step's first attempt started. */
    firstStartedAt?: Date;
    terminal: boolean;
    /** The step's last event is a `step_retrying`. */
    lastIsRetrying: boolean;
    /**
     * An inline-mode step that is open and has not moved to the background:
     * the current orchestrator runs it (again) in its own process. A
     * `step_retrying` moves it to its own message for good: that message runs
     * every later attempt, so a later attempt's `step_started` does not make
     * it runnable inline again (see {@link awaitsExternalWork}).
     */
    runnableInline: boolean;
}
/**
 * The creation a step event records: a `step_created`, or a creation-bearing
 * `step_started`. A single-orchestrator run (spec >= 9) records an inline
 * step by its first `step_started` alone, with what a `step_created` carries
 * (stepName, workflowName, input, `inline: true`), less `creatorMessageId`. It is
 * told apart by `inline: true`, which no other start carries: a replay page
 * may omit the start's input.
 */
export declare function stepCreationOf(event: Event): {
    stepName: string;
    inline: boolean;
    creatorMessageId?: string;
} | undefined;
export declare function analyzeLogSteps(events: readonly Event[]): LogStepState[];
/**
 * Whether the run waits on work that happens outside its orchestrator: an
 * open hook (created, not disposed), or a step running from its own message
 * that has no outcome yet. That is a background step, or an inline step that
 * retried: an inline step's retry moves it to its own message, which runs
 * every later attempt.
 *
 * Any open hook counts, however rarely it is resumed: a run that keeps a hook
 * open for its whole life (a cancel or approval hook beside a polling loop)
 * makes every pass that finds nothing to run linger, even one that just
 * armed a timer much longer than the linger window.
 */
export declare function awaitsExternalWork(events: readonly Event[]): boolean;
/** An open wait: created and not completed. */
export interface OpenWait {
    correlationId: string;
    resumeAt: Date;
    resumeAtMs: number;
    event: Event;
}
export declare function openWaits(events: readonly Event[]): OpenWait[];
/**
 * Open waits whose deadline has passed, and open waits named in `wakeUp`
 * (`run.wakeUp()`), whatever their deadline.
 */
export declare function dueWaits(events: readonly Event[], nowMs: number, wakeUp?: ReadonlySet<string>): OpenWait[];
/** The earliest open wait's deadline, as `ConsumedPosition` fields. */
export declare function nextTimerAt(events: readonly Event[]): {
    nextTimerAtMs?: number;
};
/**
 * A step message's `stepCreatedAt`, as epoch ms: the creation time of a
 * step whose message starts at attempt 1, which its handler passes on that
 * attempt's `step_started`. Left off a retry's message (a step start latency
 * metric covers only the first attempt) and when the time is not known.
 */
export declare function stepCreatedAtField(step: {
    stepCreatedAt?: Date;
    stepAttempt?: number;
}): {
    stepCreatedAt?: number;
};
//# sourceMappingURL=log-state.d.ts.map