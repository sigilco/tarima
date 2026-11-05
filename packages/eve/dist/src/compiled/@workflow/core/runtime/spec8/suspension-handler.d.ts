import type { Span } from '#compiled/@opentelemetry/api/index.js';
import { type SerializedData, type TraceCarrier, type ValidQueueName, type WorkflowRun, type World } from '#compiled/@workflow/world/index.js';
import type { StepInvocationQueueItem, WorkflowSuspension } from '../../global.js';
import type { PendingQueueDrain } from '../../workflow.js';
import type { SuspensionSerializationBlocker } from '../delivery.js';
import { type LoadedEventLog } from '../helpers.js';
import { ReplayRecoveryReporter } from '../replay-recovery-reporter.js';
import type { PreclaimedInlineStart } from './step-executor.js';
export interface SuspensionHandlerParams {
    suspension: WorkflowSuspension;
    world: World;
    run: WorkflowRun;
    span?: Span;
    requestId?: string;
    /**
     * The workflow is completing or failing. Its terminal event cleans up hooks,
     * so only dispose hooks needed to release a token early or for a later
     * registration.
     */
    terminalDrain?: boolean;
    /**
     * The runtime's loaded event log. Every event creation this suspension makes
     * names the position it was derived from, so a backend that has recorded
     * events the replay did not see can report them back on the write, or, if
     * it would rather refuse than report, reject it with a 412. A rejection is
     * not retried here: the event's correlation id was minted by *this* replay's
     * seeded sequence, so re-committing it against a corrected log would persist
     * an event no correct replay produces. The caller restarts the replay
     * instead.
     *
     * Extended in place by what those writes report back — the events on slots
     * they skipped over, and (on the hook create) the inline delta since its
     * cursor. Whether the log is complete afterwards is answered by
     * {@link SuspensionHandlerResult.eventLogCarriedForward}.
     */
    eventLog?: LoadedEventLog;
    /**
     * Turbo mode only: a promise that resolves once the backgrounded
     * `run_started` has landed (the run exists). When present, every world write
     * this suspension performs (`hook_created`, `wait_created`, eager overflow
     * `step_created`, …) is gated on it so the write never races ahead of the
     * run's creation. The pure inline hot path defers all of its steps and writes
     * nothing here, so it never awaits this barrier. `undefined` outside turbo,
     * where `run_started` was already awaited up front.
     */
    runReadyBarrier?: Promise<unknown>;
    /** One-shot telemetry reporter, activated only after replay has recovered. */
    replayRecoveryReporter?: ReplayRecoveryReporter;
    /**
     * Step dispatch target. When provided, the batched fan-out publishes the
     * step-execution queue message for each eagerly created step after its
     * chunk commits, and reports those steps in
     * {@link SuspensionHandlerResult.queuedStepCorrelationIds} so the caller
     * skips them in its own dispatch pass. Omitted by callers that must not
     * queue (terminal drain, tests); creates then never publish.
     */
    stepDispatch?: {
        /** The unified workflow queue this run's step messages are published to. */
        queueName: ValidQueueName;
        /**
         * Lazily resolves the trace carrier to stamp on the step messages.
         * Called at most once per suspension (memoized here).
         */
        getTraceCarrier: () => Promise<TraceCarrier>;
    };
    /**
     * Inline step ownership: the queue message ID of the invocation this
     * suspension runs in (the queue handler's meta). When present AND the
     * batched fan-out engages, the lazy-inline steps' deferred writes are
     * folded into the batch as `step_created` + `step_started` pairs (the
     * started row stamped with this ID, exactly like the lazy claim it
     * replaces), pre-claiming the steps the caller is about to run inline. See
     * {@link SuspensionHandlerResult.inlineClaims}. Callers that never
     * inline-execute (terminal drain) omit it, keeping their lazy steps on the
     * plain deferred path.
     */
    ownerMessageId?: string;
    /**
     * Lets the batched fan-out return before every chunk has committed: only
     * the chunk carrying the pre-claimed inline pairs gates the handler's
     * return (its claims are what the caller starts bodies from), while the
     * trailing chunks' commits (and every chunk's in-flush step-message
     * publishes) ride {@link SuspensionHandlerResult.deferredBatchWork}. A
     * caller that opts in MUST await that promise before acking its delivery:
     * the durability contract ("every create durable before ack") moves from
     * the handler's return to that join, and nothing else re-drives a lost
     * trailing chunk. Callers that don't opt in (terminal drain, default)
     * keep the everything-durable-at-return behavior.
     */
    allowDeferredBatchWork?: boolean;
    /**
     * The invocation's record of hooks whose force-claim victim wake it has
     * already published or attempted, whether as the forced creation's own wake
     * or as a replay's republish (see `republishOwedForceClaimVictimWakes`). The
     * caller passes one set for the whole invocation so a run that suspends more
     * than once per invocation sends each hook's wake once, not once per
     * suspension. Omitted, every suspension republishes on its own.
     */
    forceClaimVictimWakes?: Set<string>;
    /**
     * Steps this invocation is already executing inline from an earlier pass
     * of the same delivery (see `isInlineEarlyAdvanceEnabled`). They are left
     * out entirely: nothing is created, deferred, or reported in
     * `pendingSteps` for them, since their own executions write their events.
     * They still occupy inline slots, so fewer new steps are deferred for
     * inline execution while they run.
     */
    inFlightStepCorrelationIds?: ReadonlySet<string>;
}
/**
 * Result of handling a suspension. Returns pending step items so the caller
 * can decide which to execute inline vs queue to background.
 */
export interface SuspensionHandlerResult {
    /** Pending step items with events created but NOT queued */
    pendingSteps: StepInvocationQueueItem[];
    /**
     * Correlation IDs for which this suspension call actually wrote the
     * step_created event (as opposed to catching EntityConflictError because
     * a concurrent handler wrote it first). Only the handler that wrote the
     * step_created event should queue / inline-execute the step; this
     * guarantees a single owner per step, even when multiple handlers race
     * into the same batch boundary.
     */
    createdStepCorrelationIds: Set<string>;
    /**
     * Correlation IDs of steps whose arguments failed to serialize. Each was
     * finalized here as `step_created` (with a placeholder input; the real
     * input is precisely what refused to serialize) followed by `step_failed`
     * carrying the SerializationError, so the next replay rejects the step's
     * promise and a try/catch around the step call observes the error,
     * exactly like a step-body failure. No step-execution message is
     * dispatched for these, so the caller MUST force an in-process replay:
     * when the failed step was the only pending work, nothing else will ever
     * re-invoke the run to observe the terminal event.
     */
    failedStepCorrelationIds: Set<string>;
    /**
     * Correlation IDs of steps this suspension call already published
     * step-execution queue messages for (the batched fan-out's per-chunk
     * publishes). The caller MUST NOT dispatch these again: the message is
     * already out (a duplicate would be deduped by its idempotency key, but
     * costs a wasted round-trip). Empty when {@link SuspensionHandlerParams.stepDispatch}
     * was not provided or no step was eligible.
     */
    queuedStepCorrelationIds: Set<string>;
    /**
     * New steps this suspension did not defer for inline execution only
     * because steps from `inFlightStepCorrelationIds` held inline slots. They
     * are created and queued like any step past the inline limit. Zero
     * without in-flight steps.
     */
    inlineSlotsHeldBack: number;
    /**
     * How many events this phase's writes reported back as occupying slots they
     * skipped over, already merged into the caller's `eventLog.events`. Nonzero
     * means the array was reordered to restore slot order, so any index the
     * caller cached into it (payload prewarm scan position) is stale.
     */
    reportedEventCount: number;
    /**
     * The steps whose `step_created` writes were intentionally deferred so the
     * caller can run them inline via lazy `step_started` events (which create
     * the step on the fly), saving one world round-trip per inline step. Up to
     * `getMaxInlineSteps()` steps are deferred; the caller runs them inline in
     * parallel and queues the rest. Empty when no step was deferred (nothing
     * pending). The caller passes each `dehydratedInput` straight to
     * `executeStep`, which sends it as the `step_started` payload. The atomic
     * create-claim inside each `step_started` is the exactly-one-owner gate that
     * the standalone `step_created` provided before: the loser of the race gets
     * `EntityConflictError` → `skipped` and does not run the body.
     *
     * When {@link hasAwaitedHookCreation} is also set, these steps are deferred
     * but HELD: the caller advances the workflow over the `hook_created` that
     * settles the awaiter first, and runs them on the pass after it. Nothing was
     * written for them, so holding costs nothing and dangles nothing.
     */
    lazyInlineSteps: Array<{
        correlationId: string;
        stepName: string;
        dehydratedInput: SerializedData;
    }>;
    /**
     * Pre-claimed inline starts, by correlation id: the per-step verdicts of
     * the `step_created` + `step_started` pairs the batched fan-out committed
     * for the lazy-inline steps. A step with an entry here is passed to
     * `executeStep` as `preclaimedStart` INSTEAD of `lazyStepInput`: its
     * input already rode the pair, and the claim is settled: `owned: true`
     * carries the started attempt-1 entity (input re-attached) so the body
     * runs straight off the batch commit with no start write of its own;
     * `owned: false` lost the pair's atomic create-claim to a concurrent
     * writer, and executeStep returns `skipped` without running the body,
     * the same outcome as losing the lazy claim. Empty whenever the fold did
     * not engage (batching off, no `ownerMessageId`, a `hook.getConflict()`
     * awaiter whose continuation may hold the bodies back, or the lone-inline
     * case, which keeps the optimistic lazy path and its claim/body overlap).
     *
     * Crash window: the pair commits before the caller runs the body, so a
     * crash between them leaves a started step stamped with this message's
     * ID. Redelivery of the same message re-executes it via the owned-recovery
     * path, the exact machinery the lazy claim's crash window already uses.
     */
    inlineClaims: Map<string, PreclaimedInlineStart>;
    /**
     * The batched fan-out's deferred work, present only when the caller opted
     * in via {@link SuspensionHandlerParams.allowDeferredBatchWork} and
     * trailing work exists: the commits of every chunk except the pair chunk,
     * plus every chunk's step-message publishes (each chained on ITS OWN
     * chunk's commit, so publish-after-create holds per step). The caller
     * MUST await it before acking: a rejection here is a failed suspension
     * write and fails the delivery exactly as it would have at the handler's
     * return. Steps whose messages this work publishes are already in
     * {@link queuedStepCorrelationIds} at return time.
     */
    deferredBatchWork?: Promise<void>;
    /**
     * The soonest pending wait, if any: seconds until it elapses and the
     * correlationId of the wait that produced that timeout. The
     * correlationId seeds the idempotency key for the wait-continuation
     * queue message so that repeated suspension passes over the same
     * pending wait collapse into a single delayed continuation. `resumeAtMs`
     * is that wait's absolute deadline, for gates that ask whether it can fire
     * within some window rather than how long until it does.
     *
     * Covers every wait still in the workflow's queue, not only ones this
     * suspension created: a `sleep()` that lost a `Promise.race` stays queued
     * (and reported here) until its `wait_completed` lands.
     */
    waitTimeout?: {
        seconds: number;
        correlationId: string;
        resumeAtMs: number;
    };
    /**
     * Whether a hook create committed a `hook_conflict` — the token was already
     * claimed, so this run's hook was never created. The caller answers it by
     * advancing the workflow over the committed event before it dispatches or
     * runs the steps this suspension scheduled. Those steps were written
     * alongside the hook create, not after it, so their `step_created` events
     * (and, on the batched path, their step messages and any pre-claimed inline
     * pairs in {@link inlineClaims}) may already be out: work the workflow
     * started concurrently with the hook is not held back by its conflict.
     */
    hasHookConflict: boolean;
    /**
     * Whether a `hook.getConflict()` awaiter needs the workflow to continue
     * immediately. Any {@link lazyInlineSteps} this suspension deferred are
     * HELD for that continuation rather than run before it; see their docs.
     */
    hasAwaitedHookCreation: boolean;
    /**
     * Correlation ids of the hooks this suspension committed a `hook_created`
     * for while a `hook.getConflict()` awaiter was waiting on it — the events
     * that resolve those awaiters on the next pass. Empty exactly when
     * {@link hasAwaitedHookCreation} is false.
     *
     * Reported by id, not just counted, so a caller that continues in this
     * process can tell a continuation that got somewhere from one that is
     * repeating: a workflow may create one awaited hook after another, and each
     * new id is a pass that made progress, while the same id coming back means
     * the pass ran over a log that still did not hold its event and continuing
     * again cannot change that.
     */
    awaitedHookCorrelationIds: string[];
    /**
     * Correlation ids of the hooks whose create committed a `hook_conflict`.
     * Empty exactly when {@link hasHookConflict} is false.
     *
     * By id for the same reason as {@link awaitedHookCorrelationIds}, and
     * against the same hazard: a conflict is resolved by the `hook_conflict`
     * this suspension committed, and until the workflow observes it the hook
     * stays in the invocations queue and the next pass writes the create again.
     * A fresh id is progress; the same id coming back is a pass that ran over a
     * log which still did not hold the event, so continuing again cannot change
     * that.
     */
    hookConflictCorrelationIds: string[];
    /**
     * Whether the caller's `eventLog` now holds every event this suspension
     * committed, so a caller that continues in this process can replay — or
     * resume a retained VM — straight off it with no read.
     *
     * True only when the hook create's inline delta came back complete and was
     * folded in (see `hookDeltaCursor` below), and nothing else in this
     * suspension wrote an event. False whenever a read is needed first: no
     * delta was asked for or returned, it was truncated, or a step / wait /
     * attribute / abort write (single or batched) also committed and may not be
     * in it.
     *
     * Indifferent to which event the create committed: the delta is the slice
     * of the log after the caller's cursor either way, so it carries a
     * `hook_conflict` exactly as it carries a `hook_created`.
     */
    eventLogCarriedForward: boolean;
    /** Whether native workflow attribute events were written for replay. */
    hasAttributeEvents: boolean;
    /**
     * Whether this suspension created any hook (`hook_created`) events. Unlike
     * `hasHookConflict` / `hasAwaitedHookCreation`, this is true even for a plain
     * fire-and-forget hook with no conflict and no awaiter. Turbo mode uses it to
     * detect "a hook was created this suspension" and stop forcing optimistic
     * inline start (a hook introduces later resume invocations that could race).
     */
    hasHookEvents: boolean;
    /**
     * Wall-clock ms this suspension spent blocked on nothing but committing its
     * `hook_created` events (0 when it created none): the stretch the hook
     * writes outlasted every other write, since until then the suspension was
     * waiting on those too. The caller accumulates this across iterations and
     * subtracts it from the TTFS latency measurement, so time spent durably
     * creating the user's hooks doesn't count as runtime overhead.
     */
    hookCreationMs: number;
    /** Exact number of workflow-code executions observed during serialization. */
    serializationBlockerCount: number;
    /** Bounded sample used only for retention diagnostics. */
    serializationBlockers: SuspensionSerializationBlocker[];
}
/**
 * Handles a workflow suspension by processing all pending operations (hooks, steps, waits).
 * Creates events for all operations but does NOT queue step messages; returns the pending
 * steps so the caller can decide which to execute inline vs queue to background.
 *
 * Every write is issued concurrently: hook creations and disposals (in code
 * order per token, then abort deliveries), step and wait events (batched where
 * the World supports it), and attribute events.
 *
 * Hooks are not written ahead of the steps created alongside them. A step
 * started in the same suspension as a hook can therefore run before that hook
 * is registered; a workflow that needs the hook registered first (say, a step
 * that hands the token to something that resumes it at once) awaits
 * `hook.getConflict()` before calling the step. That awaiter also orders the
 * steps this suspension DEFERRED (`lazyInlineSteps`) after the registration,
 * because the caller continues the workflow over the `hook_created` before it
 * runs them — the ordering costs a queue hop only for the steps that overflow
 * the inline cap and were therefore created eagerly here.
 */
export declare function handleSuspension({ suspension, world, run, span, requestId, eventLog, terminalDrain, runReadyBarrier, replayRecoveryReporter, stepDispatch, ownerMessageId, allowDeferredBatchWork, forceClaimVictimWakes, inFlightStepCorrelationIds, }: SuspensionHandlerParams): Promise<SuspensionHandlerResult>;
/**
 * The end-of-run drain of the spec 8 orchestrator (see `PendingQueueDrain`):
 * the queued items are written like any suspension's. In turbo the writes
 * wait on `runReadyBarrier`, the backgrounded `run_started`, so they never
 * reach the World before the run exists; a rejected barrier only orders them
 * (the write itself surfaces a run that does not exist).
 */
export declare function pendingQueueDrain(world: World, runReadyBarrier?: Promise<unknown>, 
/**
 * Steps the caller is still executing inline. Read live, and left out of
 * the drain: their own executions write their events.
 */
inFlightStepCorrelationIds?: ReadonlySet<string>): PendingQueueDrain;
//# sourceMappingURL=suspension-handler.d.ts.map