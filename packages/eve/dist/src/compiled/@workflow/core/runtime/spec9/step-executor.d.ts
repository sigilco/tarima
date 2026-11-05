import type { CreateEventParams, CreateEventRequest, EventResult, SerializedData, World } from '#compiled/@workflow/world/index.js';
import type { PayloadKey } from '../../serialization/encryption.js';
import { type ResumeTtrTracking } from '../resume-latency.js';
import { type StepLatencyTracking } from '../step-latency.js';
/**
 * Whether a step's body may start before its `step_started` is durable: on
 * turbo's optimistic start, and under run-ahead's speculative creation. A
 * step that allows retries (`maxRetries > 0`, the default) is taken to be
 * idempotent and to survive running again after a lost write. One declared
 * with `maxRetries: 0` is not: its body starts only once its start has
 * committed.
 */
export declare function mayRunBeforeItsStart(stepName: string): boolean;
/**
 * Writes one step event for the executor. The orchestrator passes its
 * in-band writer (inline steps are in-band, and fenced); a background step's
 * queue handler passes a plain out-of-band writer.
 */
export type StepEventWriter = <T extends CreateEventRequest>(data: T, params?: CreateEventParams) => Promise<EventResult>;
/** A `step_started` the caller wrote for this attempt. */
export interface CallerStart {
    startedAt: Date;
    /** `Date.now()` right before the write was sent. */
    postSentAtMs?: number;
    /** `Date.now()` once it returned. */
    completedAtMs?: number;
}
export interface StepExecutorParams {
    world: World;
    /** Writes this step's events. See {@link StepEventWriter}. */
    createEvent: StepEventWriter;
    workflowRunId: string;
    /** Deployment that owns the workflow run, for forwarded writable streams. */
    workflowDeploymentId?: string;
    workflowName: string;
    workflowStartedAt: number;
    /** Request ID of the invocation executing this step, when provided by its queue. */
    requestId?: string;
    /** Root run id of this run's lineage, carried into the step context. */
    rootRunId?: string;
    stepId: string;
    stepName: string;
    encryptionKey?: PayloadKey;
    /**
     * The workflow run's specVersion, used to gate payload compression.
     * Step outputs/errors are only compressed when the run is marked as
     * compression-capable (specVersion >= 5).
     */
    runSpecVersion?: number;
    /**
     * The attempt this execution is. The caller decides it: the queue message's
     * attempt on a first delivery, the count of `step_started` events plus one
     * after a log read, or the orchestrator's own count for an inline step.
     */
    attempt: number;
    /**
     * When the step's first attempt started, for a retry. The step context's
     * `stepStartedAt` is the step's first start, not this attempt's.
     */
    firstStartedAt?: Date;
    /** The step's serialized input, as written on its creation. */
    input: SerializedData;
    /**
     * Epoch ms of the step's `step_created`, for a background step started by
     * its own message. Passed on attempt 1's `step_started` as
     * `CreateEventParams.stepCreatedAt`, and on no other write.
     */
    stepCreatedAt?: number;
    /**
     * Set when the caller already wrote this attempt's `step_started` (an
     * inline step, created by that start). The executor then writes no start
     * of its own.
     */
    started?: CallerStart;
    /**
     * The World's refusal of the `step_started` the caller wrote for this
     * attempt (an inline step's creation-bearing start, refused for a throttle
     * or a finished run). Acted on as a refusal of the executor's own start;
     * the executor writes no start.
     */
    startRefusal?: unknown;
    /** Params for the outcome write (`step_completed` / `step_failed`). */
    terminalEventParams?: CreateEventParams;
    /**
     * Whether a retry at `retryAtMs` would land after the step's queue message
     * expires. The step is then failed instead of retried. For an inline step
     * the message is the one its retry is about to be sent on, so the check is
     * measured from now.
     */
    retryOutlivesMessage?: (retryAtMs: number) => boolean;
    /**
     * Called right before user code runs. The orchestrator throws from it when
     * its in-band writer has stopped, so a superseded orchestrator never starts
     * a body.
     */
    beforeBody?: () => void;
    /**
     * Start the body before this attempt's `step_started` commits (optimistic
     * start), for a step that allows retries (see {@link mayRunBeforeItsStart}).
     * Set by turbo mode for the inline steps of a run's first delivery, where
     * no other orchestrator of the run can exist yet, so the start cannot be
     * refused by the in-band fence after the body ran; under run-ahead; and,
     * only with the opt-in `WORKFLOW_OPTIMISTIC_BACKGROUND_START`, by a
     * background step's plain first delivery, whose start is out-of-band and
     * fence-free. The `step_started` write still goes out, after
     * {@link runReadyBarrier} and {@link startAfter}, and the outcome write
     * waits for it: if the start fails, the body's outcome is discarded and the
     * start's error (or its mapped result: throttled, gone) is what the caller
     * sees. An explicit `WORKFLOW_OPTIMISTIC_INLINE_START=0` wins and takes the
     * awaited path.
     */
    forceOptimisticStart?: boolean;
    /**
     * Turbo mode only: settles once the backgrounded `run_started` has
     * landed (rejects if it failed). This attempt's `step_started` is sent only
     * after it, on both the optimistic and the awaited path, and an optimistic
     * body's stream and attribute writes wait for it too, so nothing this step
     * writes reaches the World before the run's start. `undefined` outside
     * turbo, where `run_started` was already awaited.
     */
    runReadyBarrier?: Promise<unknown>;
    /**
     * Settles once this step's creation has committed (rejects if it failed).
     * Set when the caller wrote the creation without waiting for it (turbo's
     * optimistic inline start). Resolves with the start when the creation was
     * this attempt's `step_started` (an inline step); otherwise the executor
     * sends `step_started` after it. A failure is the start's failure.
     */
    startAfter?: Promise<CallerStart | undefined | void>;
    /**
     * Latency telemetry (TTFS / STSO): eligibility and anchor timestamps decided
     * by the orchestrator. See runtime/step-latency.ts.
     */
    latencyTracking?: StepLatencyTracking;
    /**
     * Hook-resume TTR telemetry for the step that follows a resumption. See
     * runtime/resume-latency.ts.
     */
    resumeTracking?: ResumeTtrTracking;
}
/**
 * Result of a step execution attempt. The caller decides what happens next
 * (wake the orchestrator, redeliver the message, continue the replay).
 *
 * `result` is the committed outcome write, so the orchestrator can consume
 * its own resolving event only after the commit (see
 * `orchestrator/consume-after-commit.ts`).
 */
export type StepExecutionResult = {
    type: 'completed';
    hasPendingOps?: boolean;
    result: EventResult;
} | {
    type: 'failed';
    result: EventResult;
} | {
    type: 'retry';
    timeoutSeconds: number;
    retryAt: Date;
    result: EventResult;
} | {
    type: 'gone';
} | {
    type: 'throttled';
    timeoutSeconds: number;
};
/** Message of the `step_failed` written when a step exhausts its retries. */
export declare function exceededMaxRetriesMessage(stepName: string, maxRetries: number): string;
/**
 * Writes `step_failed` for a step whose next attempt would exceed its retry
 * budget, without running the body. Used when the log shows the step already
 * started `maxRetries + 1` times, including a `maxRetries: 0` step that is
 * redelivered after its single start.
 */
export declare function failStepForExhaustedRetries(params: {
    createEvent: StepEventWriter;
    workflowRunId: string;
    stepId: string;
    stepName: string;
    attempt: number;
    maxRetries: number;
    encryptionKey: PayloadKey | undefined;
    runSpecVersion?: number;
}): Promise<StepExecutionResult>;
/**
 * Writes `step_failed` for a step whose message was delivered past the
 * delivery cap (`WORKFLOW_MAX_QUEUE_DELIVERIES`) without any delivery
 * getting the step started (see `stepDeliveryStalled`), so the workflow sees
 * a failure it can catch instead of a step that never ends. The error is a
 * `FatalError` whose message names `MAX_DELIVERIES_EXCEEDED`.
 */
export declare function failStepForExhaustedDeliveries(params: {
    createEvent: StepEventWriter;
    workflowRunId: string;
    stepId: string;
    stepName: string;
    attempt: number;
    deliveries: number;
    maxDeliveries: number;
    encryptionKey: PayloadKey | undefined;
    runSpecVersion?: number;
}): Promise<StepExecutionResult>;
/** The message of a step failed by {@link failStepForExhaustedDeliveries}. */
export declare function exceededMaxDeliveriesMessage(stepName: string, deliveries: number, maxDeliveries: number): string;
/**
 * Executes one attempt of a step: writes `step_started` (unless the caller
 * already did), hydrates the input, runs the step function, and writes
 * exactly one of `step_completed`, `step_failed` or `step_retrying`.
 *
 * It decides nothing about ownership. The caller already established that
 * this invocation owns the attempt (an inline step in its orchestrator, or
 * the delivery of the step's own message after the log check). No refusal
 * from the World is read as "someone else did it": a refusal propagates, and
 * the queue's redelivery re-checks the log.
 */
export declare function executeStep(params: StepExecutorParams): Promise<StepExecutionResult>;
//# sourceMappingURL=step-executor.d.ts.map