/**
 * One orchestrator delivery, as both orchestrators see it: what the shared
 * entrypoint (`../runtime.ts`) hands to the orchestrator for the run's spec
 * version, and the helpers both use.
 *
 * - Spec 8 and below (`./spec8/`): several orchestrator invocations of a run
 *   may write at once; steps keep entities and the World's precondition guard
 *   keeps their writes consistent.
 * - Spec 9 (`./spec9/`): one writer per run, enforced by the World's in-band
 *   fence; steps are folded from the log.
 *
 * A run keeps the orchestrator of the spec version it was created with.
 */
import type { Span } from '#compiled/@opentelemetry/api/index.js';
import { type RunErrorCode } from '#compiled/@workflow/errors/index.js';
import type { Queue } from '#compiled/@workflow/world/index.js';
import { type CreateEventRequest, type Event, type resolveQueueNamespace, type WorkflowInvokePayload, type WorkflowRun, type World } from '#compiled/@workflow/world/index.js';
import type { WorkflowSuspension } from '../global.js';
import { type Logger } from '../logger.js';
import type { GuestCodeExecution } from '../serialization/hardened.js';
import { type PayloadKey } from '../serialization.js';
import { type DynamicWorkflowMetadata } from './dynamic-workflow.js';
import type { RunInputActivity } from './invocations.js';
import type { ReplayBudget } from './replay-budget.js';
import type { ResumeTtrTracking } from './resume-latency.js';
type QueueHandler = Parameters<Queue['createQueueHandler']>[1];
/** The queue metadata of one delivery. */
export type DeliveryMetadata = Parameters<QueueHandler>[1];
/**
 * What a delivery hands back to the queue: a redelivery delay (on a spec 9
 * run, `0` is a handoff to the next delivery; see `Queue.createQueueHandler`),
 * or nothing to ack.
 */
export type DeliveryResult = {
    timeoutSeconds: number;
} | undefined;
/** One orchestrator delivery, set up by the shared entrypoint. */
export interface WorkflowDelivery {
    /** The parsed queue message. */
    readonly message: WorkflowInvokePayload;
    readonly metadata: DeliveryMetadata;
    /**
     * The run's input activity for this handler, on Worlds that deliver
     * invocations (`capabilities.invoke`); see `withRunInputs`.
     */
    readonly activity: RunInputActivity | undefined;
    readonly workflowCode: string;
    readonly namespace: ReturnType<typeof resolveQueueNamespace>;
    readonly world: World;
    /** The delivery's `workflow.execute` span. */
    readonly span: Span | undefined;
    readonly runLogger: Logger;
    readonly workflowName: string;
    readonly requestId: string | undefined;
    /** Hook-resume TTR tracking, consumed by the first durable step after it. */
    readonly resumeTracking: ResumeTtrTracking | undefined;
    /** Trace carrier to attach to the messages this delivery enqueues. */
    readonly nextTraceCarrier: () => Promise<Record<string, string>>;
    readonly replayBudget: ReplayBudget;
    /**
     * The run (`resolveData: 'none'`), when routing the delivery had to read
     * it; a read that wants the same view uses it instead of reading again.
     */
    readonly prefetchedRun: WorkflowRun | undefined;
    /**
     * The spec version of the run, as routing resolved it (the message's
     * stamp or hint, or the run itself; see `resolveRunSpec`). Every
     * orchestrator message the delivery sends carries it, so a World that
     * reads the run's spec off the payload never sees an unstamped one.
     */
    readonly runSpecVersion: number;
}
/**
 * Whether this delivery reached the orchestrator of another spec than its
 * run's, by the run row the orchestrator loaded, and if so hands it on.
 *
 * Routing trusts a message's `runSpecVersion` hint (see `resolveRunSpec`),
 * so a wrong hint can deliver a run's message to the other orchestrator. The
 * row is authoritative: this sends the message again with the run's version
 * as its hint, which the next delivery routes to the right orchestrator. The
 * caller acknowledges its message without writing anything else.
 *
 * A first delivery (`runInput`) is never handed on: its version is the one
 * `start()` stamped the run with. Nor is a delivery whose run row records no
 * version.
 */
export declare function handOffToRunOrchestrator(params: {
    world: World;
    message: WorkflowInvokePayload;
    metadata: DeliveryMetadata;
    run: WorkflowRun;
    /** Whether the delivering orchestrator is the single orchestrator. */
    singleOrchestrator: boolean;
}): Promise<boolean>;
/** What the shared entrypoint needs from the orchestrator of a run's spec. */
export interface Orchestrator {
    /** Whether a delivery of `message` counts toward the run's max queue deliveries. */
    countsTowardMaxDeliveries(message: WorkflowInvokePayload): boolean;
    /**
     * Writes the `run_failed` that ends a run past its max queue deliveries.
     * Resolves `'superseded'` when the in-band fence refused the write, which
     * does not prove another orchestrator is running; the caller has the queue
     * redeliver the message to retry it. Otherwise resolves the run the write
     * returned (when the World returned one), or throws what the World threw.
     */
    writeMaxDeliveriesFailure(world: World, runId: string, eventData: RunFailedEventRequest['eventData'], requestId: string | undefined): Promise<{
        run: WorkflowRun | undefined;
    } | 'superseded'>;
    /** Runs one delivery of the run's queue message. */
    runDelivery(delivery: WorkflowDelivery): Promise<DeliveryResult>;
}
/**
 * A workflow-code execution observed while a suspension serialized its
 * writes, which keeps the retained VM from being reused (see
 * `getRetentionDecision`).
 */
export interface SuspensionSerializationBlocker extends GuestCodeExecution {
    source: 'step_input' | 'hook_metadata' | 'hook_abort';
    correlationId: string;
}
/** The max-deliveries `run_failed` request. */
export type RunFailedEventRequest = Extract<CreateEventRequest, {
    eventType: 'run_failed';
}>;
/** The workflow code a delivery replays, and the marker when it is dynamic. */
export interface ResolvedWorkflowCode {
    code: string;
    dynamicWorkflow?: DynamicWorkflowMetadata;
}
export type RetentionDecision = {
    retain: true;
} | {
    retain: false;
    reason: 'disabled' | 'serialization_executed_workflow_code' | 'no_replay_driver';
};
/**
 * The complete retained-VM policy for a suspension boundary.
 *
 * Every suspension producer uses the suspension-generation guard when
 * signaling. Otherwise a signal scheduled at boundary N could suspend the VM
 * after it has already resumed into boundary N+1. The strictly ordered event
 * log determines which branch resolution wins. A step or attribute write is
 * required to drive the next inline iteration; hook- or wait-only suspensions
 * park normally.
 *
 * Retaining across an open hook or wait also permits an out-of-band cold replay
 * to race this invocation. That is safe only because each loaded log is a
 * monotone, hole-free prefix; replaying a longer prefix preserves all earlier
 * correlation-ID draws; and `step_started` atomically chooses one owner. The
 * generation guard keeps losing same-boundary suspension signals stale, while
 * a stale-snapshot/412 restart discards the retained session and replays from
 * the authoritative log. A World that exposes a non-prefix view would violate
 * this policy's precondition and could bind one ordinal to two logical branches
 * before the step-ownership claim has a chance to arbitrate them.
 *
 * A hook-write continuation is the one boundary retained without a step or
 * attribute driver. The suspension committed the event a hook's own awaiter is
 * parked on — the `hook_created` a `hook.getConflict()` waits for, or the
 * `hook_conflict` a create whose token was already claimed committed instead —
 * and the caller advances the workflow over that event by resuming the session
 * in this process rather than re-invoking (see `continueOverHookWrite` in the
 * replay loop), so the runtime itself drives the next iteration. One arm for
 * both outcomes because it is one boundary: same write, same event slot, same
 * continuation. Steps in the same suspension ride along deferred rather than
 * queued: an awaiter holds `lazyInlineSteps` back for the pass the
 * continuation drives, and the conflict branch returns before any inline
 * execution, so a step body is never ordered ahead of a continuation this
 * invocation is still going to take. (A continuation it has already taken and
 * been refused for — the repeat guard — does let the batch run first; there is
 * nothing left for the ordering to protect by then.) The hook this suspension
 * just created is an open hook by
 * definition, and is no more a hazard than any other open hook here: a
 * `hook_received` landing out of band is absent from the log the resume reads
 * exactly as it is absent from a fetch that returned a moment before it — a
 * prefix, never a hole, corrected on the next write.
 *
 * Quiescence assumes workflow code stays inside the sandbox's determinism
 * contract. Escaping to the host realm (for example, recovering a host
 * `Function` constructor to schedule real timers) already makes ordinary cold
 * replay nondeterministic and is not defended here.
 *
 */
export declare function getRetentionDecision({ suspension, serializationBlockerCount, hookContinuation, invocationContinuation, }: {
    suspension: WorkflowSuspension;
    serializationBlockerCount: number;
    /**
     * Whether this suspension committed the event a hook's own awaiter is
     * waiting on and the caller will continue over it in-process, making the
     * runtime the replay driver for a boundary that has no step or attribute
     * write of its own. See the policy above.
     */
    hookContinuation?: boolean;
    invocationContinuation?: boolean;
}): RetentionDecision;
export declare const SERIALIZATION_BLOCKER_LOG_DETAIL_LIMIT = 160;
/** Keep retention diagnostics useful without emitting unbounded guest data. */
export declare function serializationBlockerLogMetadata(blockers: SuspensionSerializationBlocker[], count: number): {
    serializationBlockerCount: number;
    serializationBlockers: {
        source: "step_input" | "hook_metadata" | "hook_abort";
        correlationId: string;
        kind: "getter" | "proxy" | "method";
        detail: string | undefined;
    }[];
    serializationBlockersTruncated: boolean;
};
export declare function clampMaxEvents(serverValue: number | undefined): number | undefined;
export declare function findRecordedTerminalRunEvent(events: Event[], runId: string): Event | undefined;
export declare function hasRecordedTerminalRunEvent(events: Event[], runId: string): boolean;
/**
 * Maximum inline-execution duration for a single handler invocation.
 *
 * Order of precedence:
 * 1. `WORKFLOW_V2_TIMEOUT_MS` env var
 * 2. Tiered budget derived from `world.getRuntimeDeadline()`
 * 3. Default of 2 minutes
 */
export declare function getMaxInlineDurationMs(world: World, invocationStartTime: number): Promise<number>;
export declare function getWorkflowSetupErrorCode(err: unknown): RunErrorCode | null;
export declare function recordFatalRunError({ world, workflowRun, runId, workflowName, requestId, err, errorCode, logMessage, }: {
    world: World;
    workflowRun: WorkflowRun | undefined;
    runId: string;
    workflowName: string;
    requestId: string | undefined;
    err: unknown;
    errorCode: RunErrorCode;
    logMessage: string;
}): Promise<void>;
/**
 * Pick the workflow code this run replays.
 *
 * For a static run this is the deployment's bundle, returned unchanged after
 * one plaintext property read. The dynamic branch exists for runs started from
 * source: their workflow function was never in the bundle, so the code came
 * with the run, and replaying it means evaluating that exact code rather than
 * whatever the deployment now contains.
 *
 * Stored code is only executed when all of these hold, and each failure is a
 * `WorkflowRuntimeError` so the caller fails the run instead of redelivering a
 * message whose verdict cannot change:
 *
 * - this deployment has opted in to dynamic workflows;
 * - the run's `workflowName` is the id its `dynamicWorkflow` marker derives
 *   (a marker on a static workflow's run does not redirect it to stored code);
 * - the code exists and hydrates, which requires the `encr` envelope whenever
 *   the run has key material or was started with encryption.
 *
 * Two sources for the code, in order of what the invocation already holds:
 *
 * 1. On the run snapshot. The normal case: `run_created` and the queue
 *    message both carry the bytes, so a read is already unnecessary by the
 *    time replay begins.
 * 2. Read back from the run. Needed when the definition was too large to
 *    send inline and lives behind a ref, or the snapshot was read with
 *    `resolveData: 'none'`, which omits the code. The run has to exist first,
 *    hence the barrier.
 *
 * World and key-lookup errors propagate unchanged, so transient failures are
 * still redelivered.
 *
 * @param getEncryptionKey - Resolved only on the dynamic branch. The key is
 *   lazy for a reason: some deliveries never need it, and forcing it here
 *   would put a key fetch on every static run's critical path.
 * @param awaitRunReady - Orders the fallback read after the write that
 *   creates the run; a no-op once the run is durable.
 */
export declare function resolveWorkflowCodeForRun(staticWorkflowCode: string, workflowRun: WorkflowRun, getEncryptionKey: () => Promise<PayloadKey | undefined>, world: World, awaitRunReady: () => Promise<void>): Promise<ResolvedWorkflowCode>;
export {};
//# sourceMappingURL=delivery.d.ts.map