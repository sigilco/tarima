import { type BulkCancelWorkflowRunsResult, type WorkflowRun, type World } from '#compiled/@workflow/world/index.js';
export interface RecreateRunOptions {
    deploymentId?: string;
    specVersion?: number;
    /**
     * Queue namespace of the target deployment (e.g. `'eve'` for topics like
     * `__eve_wkf_workflow_*`). Falls back to `WORKFLOW_QUEUE_NAMESPACE` in
     * the calling process. Cross-context callers (e.g. the observability
     * dashboard) must pass the target deployment's namespace explicitly,
     * since a run enqueued to a topic the target deployment has no consumer
     * for is never picked up.
     */
    namespace?: string;
    /**
     * Region for the new run. Defaults to the source run's region, as reported
     * by `World.regionForRunId`, so a replay is placed where the original run's
     * data lives instead of in whatever region the calling process runs in.
     * When the world can't derive one, `start()`'s own region resolution
     * applies.
     */
    region?: string;
}
export interface StopSleepResult {
    /**
     * Number of pending sleeps the call stopped. On a single-orchestrator run
     * (spec version 9 and later) it is the number the call asked the run's
     * orchestrator to complete, which may not complete early (see
     * {@link wakeUpRun}).
     */
    stoppedCount: number;
}
export interface ReadStreamOptions {
    /**
     * The index to start reading from. Defaults to 0.
     * Negative values start from the end (e.g. -3 reads the last 3 chunks).
     */
    startIndex?: number;
}
export interface StopSleepOptions {
    /**
     * Optional list of specific correlation IDs to target.
     * If provided, only these sleep calls will be interrupted.
     * If not provided, all pending sleep calls will be interrupted.
     */
    correlationIds?: string[];
    /**
     * Queue namespace of the run's deployment (e.g. `'eve'`), used when
     * re-enqueueing the run after completing its waits. Falls back to
     * `WORKFLOW_QUEUE_NAMESPACE` in the calling process. Cross-context
     * callers (e.g. the observability dashboard) must pass it explicitly.
     */
    namespace?: string;
}
export interface ReenqueueRunOptions {
    /**
     * Queue namespace of the run's deployment (e.g. `'eve'`). Falls back to
     * `WORKFLOW_QUEUE_NAMESPACE` in the calling process. Cross-context
     * callers (e.g. the observability dashboard) must pass it explicitly.
     */
    namespace?: string;
}
export interface CancelRunOptions {
    /**
     * Optional free-text reason for the cancellation (max 512 chars), recorded
     * on the run_cancelled event and surfaced in the run detail view.
     */
    cancelReason?: string;
}
/**
 * Start a new workflow run based on an existing run.
 */
export declare function recreateRunFromExisting(world: World, runId: string, options?: RecreateRunOptions): Promise<string>;
/**
 * Whether `run` has a single orchestrator (spec version 9 and later), whose
 * writes are classified in-band or out-of-band. Older runs make neither
 * distinction, and their writes go out as they always did.
 */
export declare function isSingleOrchestratorRun(run: Pick<WorkflowRun, 'specVersion'>): boolean;
/**
 * Wakes a single-orchestrator run's orchestrator after an out-of-band write
 * (a cancellation), so a live or later orchestrator observes it. No
 * idempotency key: a duplicate wake costs a cheap delivery, a key could lose
 * the wakeup. Best effort: the write already committed, and the next
 * delivery of the run reads it either way. Older runs are not woken: their
 * next delivery observes the write, as it always did.
 */
export declare function wakeRunAfterOutOfBandWrite(world: World, run: Pick<WorkflowRun, 'runId' | 'workflowName' | 'deploymentId' | 'specVersion'>): Promise<void>;
/**
 * Cancel a workflow run.
 *
 * A run that does not exist (yet) is still cancelled through the World: a
 * `start({ experimental_hook })` candidate that was admitted but never created a run (the
 * recovery `WorkflowStartError` points at) is fenced by it, so no copy of it
 * can create the run any more. Otherwise the World answers not found, which
 * is thrown as `WorkflowRunNotFoundError`.
 *
 * @param options - Optional cancellation settings. `cancelReason` records a
 *   free-text reason (max 512 chars) on the run_cancelled event.
 */
export declare function cancelRun(world: World, runId: string, options?: CancelRunOptions): Promise<void>;
/**
 * Cancel many runs in one call.
 *
 * Fast path: if the world implements `runs.cancelMany`, the whole batch is
 * delegated to it in a single operation (one backend round-trip on
 * `@workflow/world-vercel`).
 *
 * Fallback: for worlds without `cancelMany`, this issues single-run
 * `cancelRun()` calls with at most {@link CANCEL_RUNS_FALLBACK_CONCURRENCY}
 * in flight at a time. Fallback successes are reported as `cancelled`;
 * failures are reported as `failed` with `code: 'internal_error'` and
 * `retryable: true`, deliberately without per-world error classification.
 *
 * @throws if `runIds` is empty, contains duplicates, or exceeds
 *   {@link BULK_CANCEL_MAX_RUN_IDS}.
 */
export declare function cancelRuns(world: World, runIds: string[], options?: CancelRunOptions): Promise<BulkCancelWorkflowRunsResult>;
/**
 * Re-enqueue a workflow run.
 */
export declare function reenqueueRun(world: World, runId: string, options?: ReenqueueRunOptions): Promise<void>;
/**
 * Waits of `runId` that a `run.wakeUp()` in this process asked its
 * orchestrator to complete. On a single-orchestrator run `wakeUp` returns
 * before the orchestrator writes their `wait_completed`; a caller looking for
 * the run's next pending sleep skips these.
 *
 * A wait stays here only once its wake message was published. It also stays
 * when a queue that coalesces the run's orchestrator messages merged that
 * message into a delivery that was already running, which drops its names
 * (see {@link wakeUpRun}): the wait then runs its full length while it is
 * listed here, and a caller skipping it misses a sleep that is still open.
 * world-local and world-postgres deliver the message after the running
 * delivery, so this does not happen there.
 */
export declare function pendingWakeUpWaits(runId: string): ReadonlySet<string>;
/**
 * Wake up a workflow run by interrupting pending sleep() calls.
 *
 * On a single-orchestrator run (spec version 9 and later) the run's
 * orchestrator completes the waits: this names them on an ordinary
 * orchestrator message and returns once that message is enqueued, so their
 * `wait_completed` lands shortly after. That is best-effort: a queue that
 * coalesces the run's orchestrator messages into a delivery already running
 * (world-vercel) drops the names, and the waits then run their full length.
 * A delivery is running not only while it has work: after a pass with
 * nothing left to run it stays live while the run waits on an open hook or
 * a background step (`WORKFLOW_ORCHESTRATOR_LINGER_MS`), so a wake sent just
 * after a run was active can be dropped too. `stoppedCount` then still
 * counts the waits it asked to complete.
 * A queue that holds the message until the running delivery ends (the Local
 * and Postgres Worlds) delivers it after that delivery. Older runs get
 * `wait_completed` written here.
 */
export declare function wakeUpRun(world: World, runId: string, options?: StopSleepOptions): Promise<StopSleepResult>;
/**
 * Read from a stream by stream ID.
 * Returns a ReadableStream of Uint8Array chunks.
 */
export declare function readStream(world: World, runId: string, streamId: string, options?: ReadStreamOptions): Promise<ReadableStream<Uint8Array>>;
/**
 * List all stream IDs for a workflow run.
 */
export declare function listStreams(world: World, runId: string): Promise<string[]>;
//# sourceMappingURL=runs.d.ts.map