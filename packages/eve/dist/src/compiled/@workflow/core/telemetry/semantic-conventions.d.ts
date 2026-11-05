/**
 * OpenTelemetry semantic conventions for Vercel Workflow telemetry.
 *
 * This module provides standardized telemetry attributes following OpenTelemetry semantic conventions
 * for instrumenting workflow execution, step processing, and related operations. Each exported function
 * creates a properly formatted attribute object for use with OpenTelemetry spans.
 *
 * The semantic conventions are organized into several categories:
 * - **Workflow attributes**: Track workflow lifecycle, status, and metadata
 * - **Step attributes**: Monitor individual step execution, retries, and results
 * - **Queue attributes**: Instrument message queue operations
 * - **Deployment attributes**: Capture deployment environment information
 *
 * All attribute functions are type-safe and use existing backend types to ensure
 * consistency between telemetry data and actual system state.
 *
 * @example
 * ```typescript
 * import * as Attribute from './telemetry/semantic-conventions.js';
 *
 * // Set workflow attributes on a span
 * span.setAttributes({
 *   ...Attribute.WorkflowName('my-workflow'),
 *   ...Attribute.WorkflowOperation('start'),
 *   ...Attribute.WorkflowRunStatus('running'),
 * });
 *
 * // Set step attributes
 * span.setAttributes({
 *   ...Attribute.StepName('process-data'),
 *   ...Attribute.StepStatus('completed'),
 *   ...Attribute.StepAttempt(1),
 * });
 * ```
 *
 * @see {@link https://opentelemetry.io/docs/specs/semconv/} OpenTelemetry Semantic Conventions
 * @packageDocumentation
 */
/** The name of the workflow being executed */
export declare const WorkflowName: (value: string) => {
    [k: string]: string;
};
/** The operation being performed on the workflow */
export declare const WorkflowOperation: (value: "start" | "run" | "execute" | "execute_v2") => {
    [k: string]: "start" | "run" | "execute" | "execute_v2";
};
/** Unique identifier for a specific workflow run instance */
export declare const WorkflowRunId: (value: string) => {
    [k: string]: string;
};
/** Current status of the workflow run */
export declare const WorkflowRunStatus: (value: "pending" | "running" | "cancelled" | "completed" | "failed" | "workflow_suspended") => {
    [k: string]: "pending" | "running" | "cancelled" | "completed" | "failed" | "workflow_suspended";
};
/** Timestamp when the workflow execution started (Unix timestamp) */
export declare const WorkflowStartedAt: (value: number) => {
    [k: string]: number;
};
/** Number of events processed during workflow execution */
export declare const WorkflowEventsCount: (value: number) => {
    [k: string]: number;
};
/** Whether workflow execution starts with replay or resumes a retained VM */
export declare const WorkflowExecutionMode: (value: "replay" | "retained") => {
    [k: string]: "replay" | "retained";
};
/**
 * Whether the run executes dynamic workflow code stored with the run rather
 * than the deployment's workflow bundle.
 */
export declare const WorkflowDynamic: (value: boolean) => {
    [k: string]: boolean;
};
/** Set on a `start()` that reserves a Hook token (`start({ experimental_hook })`). */
export declare const WorkflowStartHook: (value: boolean) => {
    [k: string]: boolean;
};
/** The absolute retention a `start({ experimental_hook })` asked for, ISO 8601. */
export declare const WorkflowStartHookRetentionUntil: (value: string) => {
    [k: string]: string;
};
/**
 * How a `start({ experimental_hook })` ended: `accepted` (the candidate is the token's
 * owner), `rejected` (another run owns it; no run was created), `uncertain`
 * (queueing or admission could not be confirmed: `WorkflowStartError`), or
 * `failed` (a deterministic World answer or contract error).
 */
export declare const WorkflowStartHookOutcome: (value: "failed" | "accepted" | "rejected" | "uncertain") => {
    [k: string]: "failed" | "accepted" | "rejected" | "uncertain";
};
/** The run that owns the token, on a `rejected` `start({ experimental_hook })`. */
export declare const WorkflowStartHookConflictingRunId: (value: string) => {
    [k: string]: string;
};
/**
 * Why the World refused a `start({ experimental_hook })` request it will never admit
 * (`WorkflowWorldError.reason`): `invalid`, `expired`, `token_mismatch`,
 * `ordinary_run` or `disabled`. `disabled` also marks an answer given while
 * admission was switched off.
 */
export declare const WorkflowStartHookRejectionReason: (value: string) => {
    [k: string]: string;
};
/**
 * The error code (or, without one, the error name) a `failed` or `uncertain`
 * `start({ experimental_hook })` ended on. `WORLD_CONTRACT_ERROR` marks a World answer
 * that broke the admission contract, such as a refusal naming no owner;
 * `WorkflowStartError:queue` and `WorkflowStartError:admission` mark the
 * stage an `uncertain` start could not confirm.
 */
export declare const WorkflowStartHookErrorCode: (value: string) => {
    [k: string]: string;
};
/**
 * How many times `start({ experimental_hook })` re-posted its candidate's `run_created`
 * to confirm an uncertain admission in place. `0` when the first answer
 * settled it.
 */
export declare const WorkflowStartHookConfirmAttempts: (value: number) => {
    [k: string]: number;
};
/**
 * Set when publishing a `start({ experimental_hook })` candidate's queue message failed
 * without a permanent answer. An `accepted` outcome alongside it means the
 * message was published again after admission.
 */
export declare const WorkflowStartHookEnqueueFailed: (value: boolean) => {
    [k: string]: boolean;
};
/**
 * How the queued copy of a start Hook candidate learned its outcome, on its
 * invocation span: `run_started`, the write this delivery made, or
 * `run_load`, a redelivery's read of a run whose `run_started` an earlier
 * delivery committed.
 */
export declare const WorkflowStartHookTrigger: (value: "run_started" | "run_load") => {
    [k: string]: "run_started" | "run_load";
};
/** SHA-256 of a dynamic run's source and step bindings. */
export declare const WorkflowDynamicSourceHash: (value: string) => {
    [k: string]: string;
};
/** Size in bytes of a dynamic run's serialized workflow code. */
export declare const WorkflowDynamicCodeBytes: (value: number) => {
    [k: string]: number;
};
/** Whether a dynamic run's code was stored inline or behind a ref. */
export declare const WorkflowDynamicCodeStorage: (value: "inline" | "ref") => {
    [k: string]: "inline" | "ref";
};
/** Whether the compiled application workflow bundle was cached. */
export declare const WorkflowBundleCompileCacheHit: (value: boolean) => {
    [k: string]: boolean;
};
/** Operation that supplied events to the current replay. */
export type WorkflowReplayLoadSource = 'run_started' | 'hook_preload' | 'events_list' | 'events_list_incremental';
export declare const WorkflowReplayLoadSource: (value: WorkflowReplayLoadSource) => {
    [k: string]: WorkflowReplayLoadSource;
};
/**
 * Events the replay walked past that no consumer claimed, still held when the
 * replay stopped.
 *
 * A non-zero count on a suspension is ordinary: an out-of-band delivery that
 * landed ahead of the code that reads it waits for the replay that gets there.
 * From inside one replay that is indistinguishable from an event no replay will
 * ever claim, because the two differ only in what the next replay does. So the
 * count goes on the span instead of failing the run, and the case worth acting
 * on is a query across a run's spans: the same
 * {@link WorkflowParkedEventId} held on suspension after suspension.
 */
export declare const WorkflowParkedEventsCount: (value: number) => {
    [k: string]: number;
};
/** Oldest event still held unclaimed when the replay stopped. */
export declare const WorkflowParkedEventId: (value: string) => {
    [k: string]: string;
};
/** Type of the oldest event still held unclaimed when the replay stopped. */
export declare const WorkflowParkedEventType: (value: string) => {
    [k: string]: string;
};
/**
 * Payloads resumed into the run's start Hook (`start(workflow, args, { experimental_hook
 * })`) that the workflow had not opened with `createHook` when the replay
 * stopped. Counted apart from {@link WorkflowParkedEventsCount}: the workflow
 * may claim them later, or never (a start token used only as an idempotency
 * key), and neither is a fault. Includes a takeover of the unopened Hook by
 * another run (`hook_disposed` with `forceClaimedBy`).
 */
export declare const WorkflowParkedStartHookEventsCount: (value: number) => {
    [k: string]: number;
};
/** Number of arguments passed to the workflow */
export declare const WorkflowArgumentsCount: (value: number) => {
    [k: string]: number;
};
/** Type of the workflow result */
export declare const WorkflowResultType: (value: string) => {
    [k: string]: string;
};
/** Whether trace context was propagated to this workflow execution */
export declare const WorkflowTracePropagated: (value: boolean) => {
    [k: string]: boolean;
};
/** The VM engine executing the workflow function for this invocation */
export declare const WorkflowVm: (value: "node" | "quickjs") => {
    [k: string]: "node" | "quickjs";
};
/** Outcome of a QuickJS VM workflow invocation */
export declare const QuickJSOutcome: (value: "completed" | "failed" | "suspended") => {
    [k: string]: "completed" | "failed" | "suspended";
};
/** Whether preloaded events from `events.create('run_started')` were used */
export declare const QuickJSEventsPreloaded: (value: boolean) => {
    [k: string]: boolean;
};
/** Total number of events fetched from the world for this invocation */
export declare const QuickJSEventsFetchedCount: (value: number) => {
    [k: string]: number;
};
/** Number of pages required to fetch all events */
export declare const QuickJSEventsFetchedPages: (value: number) => {
    [k: string]: number;
};
/** Number of pending VM operations captured at suspension */
export declare const QuickJSPendingOpsCount: (value: number) => {
    [k: string]: number;
};
/** Number of steps executed inline (live-VM continuation) this invocation */
export declare const QuickJSInlineSteps: (value: number) => {
    [k: string]: number;
};
/** Whether this QuickJS invocation restored a persisted VM snapshot */
export declare const QuickJSSnapshotRestored: (value: boolean) => {
    [k: string]: boolean;
};
/** Events replayed on top of a restored snapshot (the delta after its cursor) */
export declare const QuickJSSnapshotDeltaEvents: (value: number) => {
    [k: string]: number;
};
/** Time spent loading, verifying and decoding a persisted snapshot */
export declare const QuickJSSnapshotRestoreMs: (value: number) => {
    [k: string]: number;
};
/** Why a stored snapshot was not restored (the invocation replayed in full) */
export declare const QuickJSSnapshotFallbackReason: (value: string) => {
    [k: string]: string;
};
/** Time the post-response snapshot save pipeline took */
export declare const QuickJSSnapshotSaveMs: (value: number) => {
    [k: string]: number;
};
/** Uncompressed size of a saved VM snapshot */
export declare const QuickJSSnapshotPlaintextBytes: (value: number) => {
    [k: string]: number;
};
/** Stored (compressed, encrypted) size of a saved VM snapshot */
export declare const QuickJSSnapshotStoredBytes: (value: number) => {
    [k: string]: number;
};
/** Active trace-correlation mode for this invocation (linked or continuous) */
export declare const WorkflowTraceMode: (value: "linked" | "continuous") => {
    [k: string]: "linked" | "continuous";
};
/** Whether this workflow invocation is using the turbo first-delivery path */
export declare const WorkflowTurbo: (value: boolean) => {
    [k: string]: boolean;
};
/** The delivery found nothing new since the last consumed position. */
export declare const WorkflowNoopDelivery: (value: boolean) => {
    [k: string]: boolean;
};
/** The in-band fence refused this orchestrator delivery's write. */
export declare const WorkflowSuperseded: (value: boolean) => {
    [k: string]: boolean;
};
/**
 * The queue's `attempt` for this delivery, which the delivery cap counts:
 * `deliveryCount` less the deliveries that followed a handoff and less
 * coalesced re-runs (see `Queue` in `@workflow/world`).
 */
export declare const WorkflowDeliveryAttempt: (value: number) => {
    [k: string]: number;
};
/**
 * The queue's `deliveryCount` for this delivery, when the World reports it:
 * every delivery of the message, handoffs and coalesced re-runs included.
 * Above `workflow.delivery.attempt` on a handoff or a coalesced re-run.
 */
export declare const WorkflowDeliveryCount: (value: number) => {
    [k: string]: number;
};
/**
 * Why a spec 9 orchestrator delivery ended before the run suspended or
 * finished: `superseded`, `deadline`, `hook-conflict`, `pending-stream-ops`,
 * `quickjs-continue`, `run-ahead-restart`, `run-ahead-stop-handoff`. Unset
 * when the delivery ran to a suspension or the run's end.
 */
export declare const WorkflowDeliveryExitReason: (value: string) => {
    [k: string]: string;
};
/**
 * Whether a spec 9 orchestrator delivery handed the run to a fresh delivery
 * of the same message (`{ timeoutSeconds: 0 }`).
 */
export declare const WorkflowDeliveryHandoff: (value: boolean) => {
    [k: string]: boolean;
};
/**
 * Consecutive in-band fence refusals of this run's orchestrator deliveries in
 * this process, set once the streak is long enough to log at warn.
 */
export declare const WorkflowConsecutiveFenceRefusals: (value: number) => {
    [k: string]: number;
};
/**
 * Step messages a spec 9 orchestrator delivery's invocation sent again under
 * their stable idempotency keys: background steps created and not started,
 * re-sent once per invocation by a delivery that is not its message's first
 * (a redelivery, a handoff continuation, a coalesced re-run). Set whenever a
 * delivery passes that gate, 0 included. Most of these are deduped by the
 * queue against the step's first message.
 */
export declare const WorkflowReenqueueCount: (value: number) => {
    [k: string]: number;
};
/**
 * Steps the same re-send left alone because their last send is older than
 * the re-send age bound, past which a second message could outlive the
 * queue's dedupe window.
 */
export declare const WorkflowReenqueueSkippedTooOld: (value: number) => {
    [k: string]: number;
};
/**
 * The delivery is of a recovery message a World sent after it lost its
 * queue (world-local after a restart): its re-send also covers steps that
 * started and have no outcome, and it arms every open wait's timer.
 */
export declare const WorkflowReenqueueRecovery: (value: boolean) => {
    [k: string]: boolean;
};
/** Name of the error that caused workflow failure */
export declare const WorkflowErrorName: (value: string) => {
    [k: string]: string;
};
/** Error message when workflow fails */
export declare const WorkflowErrorMessage: (value: string) => {
    [k: string]: string;
};
/** Error classification code (USER_ERROR, RUNTIME_ERROR, etc.) */
export declare const WorkflowErrorCode: (value: string) => {
    [k: string]: string;
};
/** Number of steps created during workflow execution */
export declare const WorkflowStepsCreated: (value: number) => {
    [k: string]: number;
};
/** Number of hooks created during workflow execution */
export declare const WorkflowHooksCreated: (value: number) => {
    [k: string]: number;
};
/** Number of waits created during workflow execution */
export declare const WorkflowWaitsCreated: (value: number) => {
    [k: string]: number;
};
/**
 * Number of steps this suspension finalized as failed because their
 * arguments refused to serialize (step_created placeholder + step_failed
 * carrying the SerializationError; see finalizeUnserializableStep).
 */
export declare const WorkflowStepsFailedSerialization: (value: number) => {
    [k: string]: number;
};
/**
 * Number of inline-owned steps this invocation re-executed because it is a
 * redelivery of their owning queue message (crash recovery for inline
 * steps; see the inline step ownership changelog, workflow#2780).
 */
export declare const WorkflowOwnedRecoverySteps: (value: number) => {
    [k: string]: number;
};
/**
 * Number of pending steps for which this replay suppressed the immediate
 * requeue (another invocation inline-owns them under a live lease) and
 * ensured a delayed backstop wake instead.
 */
export declare const WorkflowBackstopWakesArmed: (value: number) => {
    [k: string]: number;
};
/**
 * Replay passes this invocation started after one inline step settled while
 * sibling inline steps were still running (see `isInlineEarlyAdvanceEnabled`).
 */
export declare const WorkflowInlineEarlyAdvances: (value: number) => {
    [k: string]: number;
};
/**
 * Inline steps of this invocation still running when it wrote the run's
 * terminal event (a `Promise.race` loser, or a step the workflow stopped
 * awaiting). Their later step events land after `run_completed`/`run_failed`.
 */
export declare const WorkflowInlineRunningAtTerminal: (value: number) => {
    [k: string]: number;
};
/**
 * `retry` or `throttled` outcomes of inline steps that settled only after
 * this invocation ended the run, so nothing acted on them: the step's
 * remaining attempts are not run.
 */
export declare const WorkflowInlineDiscardedOutcomes: (value: number) => {
    [k: string]: number;
};
/**
 * New steps queued instead of run inline because inline steps still running
 * from an earlier replay pass held the inline slots.
 */
export declare const WorkflowInlineSlotsHeldBack: (value: number) => {
    [k: string]: number;
};
/**
 * Number of pending steps whose immediate step-execution enqueue this replay
 * pass skipped because THIS invocation already published that step's message
 * on an earlier pass (a fan-out that ran inline steps and replayed again).
 * Invocation-local knowledge only: a fresh delivery never skips.
 */
export declare const WorkflowDispatchRepublishSkipped: (value: number) => {
    [k: string]: number;
};
/** The workflow runtime route being handled */
export declare const WorkflowRouteType: (value: "flow") => {
    [k: string]: "flow";
};
/** Whether this route invocation reused an already-created request handler */
export declare const WorkflowRouteHandlerCached: (value: boolean) => {
    [k: string]: boolean;
};
/** Number of times this in-memory route handler has been invoked */
export declare const WorkflowRouteInvocationCount: (value: number) => {
    [k: string]: number;
};
/** Time since this route entrypoint was constructed, in milliseconds */
export declare const WorkflowRouteEntrypointAgeMs: (value: number) => {
    [k: string]: number;
};
/** Time spent evaluating the generated route module body before creating the entrypoint */
export declare const WorkflowRouteModuleBodyInitMs: (value: number) => {
    [k: string]: number;
};
/**
 * Compute instance handling this route: the synthesized `COMPUTE_INSTANCE_ID`.
 * Uses OTEL `faas.instance` (execution-environment id, reused across
 * invocations to the same function):
 * https://opentelemetry.io/docs/specs/semconv/attributes-registry/faas/
 */
export declare const FaasInstance: (value: string) => {
    [k: string]: string;
};
/** Name of the step function being executed */
export declare const StepName: (value: string) => {
    [k: string]: string;
};
/** Unique identifier for the step instance */
export declare const StepId: (value: string) => {
    [k: string]: string;
};
/** Current attempt number for step execution (starts at 1) */
export declare const StepAttempt: (value: number) => {
    [k: string]: number;
};
/** Current status of the step */
export declare const StepStatus: (value: "pending" | "running" | "cancelled" | "completed" | "failed") => {
    [k: string]: "pending" | "running" | "cancelled" | "completed" | "failed";
};
/** Maximum number of retries allowed for this step */
export declare const StepMaxRetries: (value: number) => {
    [k: string]: number;
};
/** Whether trace context was propagated to this step execution */
export declare const StepTracePropagated: (value: boolean) => {
    [k: string]: boolean;
};
/**
 * Client-measured time-to-first-step latency in milliseconds: run creation →
 * this step's body beginning to execute, minus pre-step hook-creation time.
 * Only present on the run's first step execution when it qualified for
 * measurement (see runtime/step-latency.ts).
 */
export declare const StepTtfsMs: (value: number) => {
    [k: string]: number;
};
/**
 * Client-measured step-to-step overhead in milliseconds: the previous step's
 * terminal event → this step's body beginning to execute. Only present when
 * the two steps ran back-to-back.
 */
export declare const StepStsoMs: (value: number) => {
    [k: string]: number;
};
/**
 * Client-measured run_started-to-first-step latency in milliseconds: the
 * `run_started` response landing (or, under turbo, the local run synthesis
 * instant) → this step's start POST being issued. A sub-window of ttfs that
 * isolates replay overhead from the run-creation queue hop. Only present on
 * the run's first step execution when it qualified for measurement (see
 * runtime/step-latency.ts).
 */
export declare const StepRsfsMs: (value: number) => {
    [k: string]: number;
};
/**
 * Client-measured synchronous workflow-function replay duration in
 * milliseconds, excluding awaited network I/O, of only the FINAL replay pass
 * within the rsfs window: the pass that reached and scheduled the first
 * step. Not accumulated across earlier pre-first-step passes (e.g. a
 * workflow-body `setAttributes()` detour replays more than once, and a
 * redelivery omits earlier invocations' work entirely), so this must not be
 * read as "the replay portion of rsfs"; step.rsfs_ms covers the whole
 * window. Only present alongside step.rsfs_ms and only for the run's first
 * step (see runtime/step-latency.ts).
 */
export declare const StepFinalSchedulingReplayMs: (value: number) => {
    [k: string]: number;
};
/**
 * Runtime startup-latency optimizations active for the ttfs/stso measurement
 * (e.g. 'turbo', 'lazyStepStart', 'optimisticStart').
 */
export declare const StepLatencyOptimizations: (value: string[]) => {
    [k: string]: string[];
};
/**
 * How the step's initial `step_started` claim was made. Only present for
 * inline create claims; ordinary background starts and owned recovery remain
 * unlabeled.
 */
export type StepStartStrategy = 'awaited' | 'optimistic' | 'batch_preclaimed';
export declare const StepStartStrategy: (value: StepStartStrategy) => {
    [k: string]: StepStartStrategy;
};
/** Whether the step was skipped during execution */
export declare const StepSkipped: (value: boolean) => {
    [k: string]: boolean;
};
/** Reason why the step was skipped */
export declare const StepSkipReason: (value: "pending" | "running" | "cancelled" | "completed" | "failed") => {
    [k: string]: "pending" | "running" | "cancelled" | "completed" | "failed";
};
/** Number of arguments passed to the step function */
export declare const StepArgumentsCount: (value: number) => {
    [k: string]: number;
};
/** Type of the step result */
export declare const StepResultType: (value: string) => {
    [k: string]: string;
};
/** Name of the error that caused step failure */
export declare const StepErrorName: (value: string) => {
    [k: string]: string;
};
/** Error message when step fails */
export declare const StepErrorMessage: (value: string) => {
    [k: string]: string;
};
/** Whether the step failed with a fatal error (no retries) */
export declare const StepFatalError: (value: boolean) => {
    [k: string]: boolean;
};
/** Whether all retry attempts have been exhausted */
export declare const StepRetryExhausted: (value: boolean) => {
    [k: string]: boolean;
};
/** Number of seconds to wait before next retry attempt */
export declare const StepRetryTimeoutSeconds: (value: number) => {
    [k: string]: number;
};
/** Whether the step will be retried after this failure */
export declare const StepRetryWillRetry: (value: boolean) => {
    [k: string]: boolean;
};
/** Messaging system identifier (standard OTEL: messaging.system) */
export declare const MessagingSystem: (value: string) => {
    [k: string]: string;
};
/** Destination name/queue name (standard OTEL: messaging.destination.name) */
export declare const MessagingDestinationName: (value: string) => {
    [k: string]: string;
};
/** The message id being handled (standard OTEL: messaging.message.id) */
export declare const MessagingMessageId: (value: string & import("#compiled/zod/index.js").$brand<"MessageId">) => {
    [k: string]: string & import("#compiled/zod/index.js").$brand<"MessageId">;
};
/** Operation type (standard OTEL: messaging.operation.type) */
export declare const MessagingOperationType: (value: "publish" | "receive" | "process") => {
    [k: string]: "publish" | "receive" | "process";
};
/**
 * Messages carried by one batched publish (standard OTEL:
 * messaging.batch.message_count). Set only on the batch send, so a span
 * without it is a single-message publish.
 */
export declare const MessagingBatchMessageCount: (value: number) => {
    [k: string]: number;
};
/** Time taken to enqueue the message in milliseconds (workflow-specific) */
export declare const QueueOverheadMs: (value: number) => {
    [k: string]: number;
};
/** Unique identifier for the deployment environment */
export declare const DeploymentId: (value: string) => {
    [k: string]: string;
};
/** The deployment a run is pinned to, set only on a misrouted delivery. */
export declare const WorkflowRunPinnedDeploymentId: (value: string) => {
    [k: string]: string;
};
/** Re-route attempts for this misrouted delivery, including this one. */
export declare const WorkflowDeploymentMismatchRetryCount: (value: number) => {
    [k: string]: number;
};
/** Whether the misrouted delivery was re-routed instead of failing the run. */
export declare const WorkflowDeploymentMismatchRecovered: (value: boolean) => {
    [k: string]: boolean;
};
/**
 * The run's spec version: on `start()`, the version it stamped on the new
 * run; on a `workflow.execute` span, the version that picked the
 * orchestrator handling the delivery.
 */
export declare const WorkflowRunSpecVersion: (value: number) => {
    [k: string]: number;
};
/**
 * Where the stamped spec version came from: the caller's own World
 * (`same-deployment`), the caller (`explicit`), or, for a cross-deployment
 * start, the target's capability probe (`probe`, `probe-unversioned`,
 * `probe-malformed`) or a
 * fallback when it did not answer (`probe-miss`, `no-probe-channel`).
 */
export declare const WorkflowRunSpecVersionSource: (value: string) => {
    [k: string]: string;
};
/** Round-trip time of a cross-deployment capability probe that answered. */
export declare const WorkflowCapabilityProbeLatencyMs: (value: number) => {
    [k: string]: number;
};
/**
 * Whether a cross-deployment start reused an earlier answer from the same
 * target deployment instead of probing it again.
 */
export declare const WorkflowCapabilityProbeCached: (value: boolean) => {
    [k: string]: boolean;
};
/** Why a cross-deployment capability probe failed (e.g. a timeout). */
export declare const WorkflowCapabilityProbeError: (value: string) => {
    [k: string]: string;
};
/** Token identifying a specific hook */
export declare const HookToken: (value: string) => {
    [k: string]: string;
};
/** Unique identifier for a hook instance */
export declare const HookId: (value: string) => {
    [k: string]: string;
};
/** Whether a hook was found by its token */
export declare const HookFound: (value: boolean) => {
    [k: string]: boolean;
};
/**
 * Producer-side signal (on the `hook.resume` span) that the direct
 * `hook_received` write failed transiently but the queue dispatch succeeded, so
 * the resume is recovered via the consumer's re-ensure. Corresponds to
 * `ResumedHook.resilientResume === true`.
 *
 * No longer emitted: current producers require the durable event write to
 * succeed. Retained so dashboards and queries built on the attribute keep
 * resolving while older producers are still deployed.
 */
export declare const HookResilientResume: (value: boolean) => {
    [k: string]: boolean;
};
/**
 * What the `hook.resume` span's last by-token lookup found: `found`,
 * `redirected` (the token's new owner, after a takeover while the resume was
 * in flight) or `not_found`.
 */
export declare const HookLookupResult: (value: "found" | "redirected" | "not_found") => {
    [k: string]: "found" | "redirected" | "not_found";
};
/**
 * Producer-side signal (on the `hook.resume` span) that the durable
 * `hook_received` write COMMITTED. Stamped after the write resolves, so it
 * distinguishes a committed resume from an attempted one — an entry-time
 * attribute cannot, because a span that later records an exception may have
 * failed either before or after the commit.
 */
export declare const HookResumeCommitted: (value: boolean) => {
    [k: string]: boolean;
};
/**
 * Producer-side signal (on the `hook.resume` span) that the workflow wake was
 * ACCEPTED by the queue, stamped after the publish resolves.
 *
 * Together with {@link HookResumeCommitted} this makes stranded resumes
 * queryable: `resume_committed=true` with `wake_published` absent is a resume
 * whose durable event exists but whose wake publish failed (the caller was
 * told, but nothing re-drives it), and `resume_committed=true` +
 * `wake_published=true` with no subsequent workflow execution for the run is
 * a wake the queue accepted but never delivered. Both are detection-only
 * signals — nothing recovers such a run automatically today beyond a later
 * wake from any other source.
 */
export declare const HookWakePublished: (value: boolean) => {
    [k: string]: boolean;
};
/**
 * Consumer-side signal (on the workflow execution span) that this replay
 * materialized the `hook_received` event from the queue message's `hookInput`
 * because no committed event was found, which completes the recovery path
 * {@link HookResilientResume} began.
 *
 * Legacy / non-atomic re-ensure signal only. Legacy atomic lazy resumes
 * (resumeId + digest) go through the hoisted preload write instead, whose
 * response cannot tell whether the producer or the consumer won the
 * `(runId, resumeId)` claim, so this attribute is deliberately NOT emitted
 * for them (emitting `true` unconditionally would count every producer-won
 * resume as a recovery). The producer-begin ({@link HookResilientResume}) /
 * consumer-materialized pairing is therefore no longer complete for atomic
 * lazy resumptions; use {@link HookResumeSetupSource} to observe that path.
 */
export declare const HookResilientResumeMaterialized: (value: boolean) => {
    [k: string]: boolean;
};
/**
 * Consumer-side signal (on the workflow execution span) of how a lazy hook
 * resume initialized its replay state:
 *
 * - `hook_received_stream`: the hoisted `hook_received` write returned a
 *   usable replay preload (run + complete event log), so the invocation
 *   skipped both the `run_started` write and the initial `events.list`.
 * - `hook_received_fallback`: the hoisted write succeeded but returned no
 *   usable preload (a CBOR response from an older server, a World that
 *   ignored the opt-in, a bounded `hasMore` page, or a preload that failed
 *   validation); the invocation fell back to the `run_started` setup without
 *   re-posting the hook.
 *
 * Absent on legacy hook deliveries (no resumeId/digest) and on every other
 * delivery kind, which take the `run_started` setup unconditionally.
 *
 * This is a latency/setup-path signal: it says which requests initialized
 * the invocation, NOT that this consumer created the `hook_received` event
 * (the hoisted write may equally have converged on the producer's, since
 * claim ownership is not observable client-side; cf.
 * {@link HookResilientResumeMaterialized}).
 */
export declare const HookResumeSetupSource: (value: string) => {
    [k: string]: string;
};
/**
 * How the queued-step consumer resolved the run identity for this execution:
 * `run_context` — carried on the dispatch message, no `runs.get` before the
 * step (the fetch-free prologue); `runs_get` — the legacy blocking fetch
 * (message from an older producer). Distinguishes the two paths during
 * version-skew windows and makes the saved round trip directly measurable.
 */
export declare const StepDispatchPrologue: (value: "run_context" | "runs_get") => {
    [k: string]: "run_context" | "runs_get";
};
/**
 * What a background step's delivery did with its message
 * (`spec9/step-delivery.ts`): `run` the body, `ack` without running it,
 * `redeliver` it later (a `retryAfter` not reached yet), or `fail` the step
 * for exceeding its retries, or for a message delivered past the delivery
 * cap without the step starting. A long `retryAfter` is many `redeliver`
 * deliveries of one message; this tells them apart from the run.
 */
export declare const StepDeliveryDecision: (value: "run" | "ack" | "redeliver" | "fail") => {
    [k: string]: "run" | "ack" | "redeliver" | "fail";
};
/**
 * Why a background step's delivery did not run the body: `step-terminal`,
 * `run-terminal`, `retry-after`, `max-retries` or `max-deliveries`. Absent
 * for `run`.
 */
export declare const StepDeliveryReason: (value: string) => {
    [k: string]: string;
};
/** The delay a `redeliver` delivery asked the queue for, in seconds. */
export declare const StepDeliveryTimeoutSeconds: (value: number) => {
    [k: string]: number;
};
/** Total TTR: entry into `resumeHook()` → immediately before `stepFn.apply()`. */
export declare const ResumeTotalMs: (value: number) => {
    [k: string]: number;
};
/** Phase: `resumeHook()` entry → the queue publish being requested. */
export declare const ResumeProducerPrepMs: (value: number) => {
    [k: string]: number;
};
/** Phase: queue publish requested → the final consumer's handler being entered. */
export declare const ResumeQueueDeliveryMs: (value: number) => {
    [k: string]: number;
};
/** Phase: consumer entry → replay beginning. */
export declare const ResumeSetupMs: (value: number) => {
    [k: string]: number;
};
/** Phase: replay beginning → the next durable step being encountered. */
export declare const ResumeReplayMs: (value: number) => {
    [k: string]: number;
};
/** Phase: step encountered → the `step_started` request beginning. */
export declare const ResumeStepDispatchMs: (value: number) => {
    [k: string]: number;
};
/**
 * Phase: `step_started` request beginning → its response returning. Omitted
 * under optimistic inline start, where the claim is not awaited before the
 * body runs and therefore has no completion instant at that point; the time
 * is then reported entirely as {@link ResumeStepPrepareMs}.
 */
export declare const ResumeStepClaimMs: (value: number) => {
    [k: string]: number;
};
/**
 * Phase: claim returning → immediately before `stepFn.apply()`. Deliberately
 * includes encryption-key resolution, argument hydration, and step-context
 * setup; `workflow.queue.deserialize_time_ms` still isolates hydration.
 */
export declare const ResumeStepPrepareMs: (value: number) => {
    [k: string]: number;
};
/** What triggered the measured resumption. */
export declare const ResumeTrigger: (value: "hook") => {
    [k: string]: "hook";
};
/**
 * Which `resumeHook()` dispatch path produced this resume. `parallel` only
 * appears for messages published by an older producer, which wrote
 * `hook_received` itself in parallel with the publish.
 */
export declare const ResumeStrategy: (value: "lazy" | "parallel" | "sequential") => {
    [k: string]: "lazy" | "parallel" | "sequential";
};
/**
 * How the consuming invocation initialized replay state. Distinct from the
 * pre-existing {@link HookResumeSetupSource} (`workflow.resume_setup_source`,
 * on the workflow execution span), which reports the finer-grained
 * hoisted-write outcome; this one is the TTR dimension and shares the metric's
 * three-value vocabulary.
 */
export declare const ResumeSetupSource: (value: "run_started" | "hook_preload" | "event_load") => {
    [k: string]: "run_started" | "hook_preload" | "event_load";
};
/** Whether the measured step ran in the resuming invocation or a queued one. */
export declare const ResumeStepExecution: (value: "inline" | "dispatched") => {
    [k: string]: "inline" | "dispatched";
};
/** Number of webhook handlers triggered */
export declare const WebhookHandlersTriggered: (value: number) => {
    [k: string]: number;
};
export declare const WorkflowSuspensionState: (value: "suspended") => {
    [k: string]: "suspended";
};
export declare const WorkflowSuspensionHookCount: (value: number) => {
    [k: string]: number;
};
export declare const WorkflowSuspensionStepCount: (value: number) => {
    [k: string]: number;
};
export declare const WorkflowSuspensionWaitCount: (value: number) => {
    [k: string]: number;
};
/** HTTP request method (standard OTEL: http.request.method) */
export declare const HttpRequestMethod: (value: string) => {
    [k: string]: string;
};
/** Route pattern for the request (standard OTEL: http.route) */
export declare const HttpRoute: (value: string) => {
    [k: string]: string;
};
/** Full URL of the request (standard OTEL: url.full) */
export declare const UrlFull: (value: string) => {
    [k: string]: string;
};
/** Server hostname (standard OTEL: server.address) */
export declare const ServerAddress: (value: string) => {
    [k: string]: string;
};
/** Server port (standard OTEL: server.port) */
export declare const ServerPort: (value: number) => {
    [k: string]: number;
};
/** HTTP response status code (standard OTEL: http.response.status_code) */
export declare const HttpResponseStatusCode: (value: number) => {
    [k: string]: number;
};
/** Error type when request fails (standard OTEL: error.type) */
export declare const ErrorType: (value: string) => {
    [k: string]: string;
};
/** Format used for parsing response body (cbor or json) */
export declare const WorldParseFormat: (value: "cbor" | "json") => {
    [k: string]: "cbor" | "json";
};
/** Number of pagination pages loaded when fetching workflow events */
export declare const WorkflowEventsPagesLoaded: (value: number) => {
    [k: string]: number;
};
/** Time spent deserializing the queue message in milliseconds */
export declare const QueueDeserializeTimeMs: (value: number) => {
    [k: string]: number;
};
/** Time spent executing the handler logic in milliseconds */
export declare const QueueExecutionTimeMs: (value: number) => {
    [k: string]: number;
};
/** Time spent serializing the response in milliseconds */
export declare const QueueSerializeTimeMs: (value: number) => {
    [k: string]: number;
};
/** Whether this serialize/deserialize was a write or read. */
export declare const SerializationOperation: (value: "serialize" | "deserialize") => {
    [k: string]: "serialize" | "deserialize";
};
/** Whether a compression codec was applied (write) / present (read). */
export declare const SerializationCompressed: (value: boolean) => {
    [k: string]: boolean;
};
/** Which compression codec applied / was present (`zstd`, `gzip`, or `none`). */
export declare const SerializationCodec: (value: "gzip" | "zstd" | "none") => {
    [k: string]: "gzip" | "zstd" | "none";
};
/** Logical (uncompressed, devalue-prefixed) payload size in bytes. */
export declare const SerializationUncompressedBytes: (value: number) => {
    [k: string]: number;
};
/** Stored (post-compression, pre-encryption) payload size in bytes. */
export declare const SerializationStoredBytes: (value: number) => {
    [k: string]: number;
};
/** Fraction of bytes saved by compression (0..1); set only when compressed. */
export declare const SerializationCompressionRatio: (value: number) => {
    [k: string]: number;
};
/**
 * Number of workflow (guest) code executions serialization could not avoid
 * (getters, proxies, custom serializers); set only when non-zero.
 */
export declare const SerializationGuestCodeExecutions: (value: number) => {
    [k: string]: number;
};
/**
 * Deduplicated `kind (detail)` descriptions of the guest-code executions;
 * set only when non-zero.
 */
export declare const SerializationGuestCodeDetails: (value: string[]) => {
    [k: string]: string[];
};
/** The remote service name for Datadog service maps (Datadog-specific: peer.service) */
export declare const PeerService: (value: string) => {
    [k: string]: string;
};
/** RPC system identifier (standard OTEL: rpc.system) */
export declare const RpcSystem: (value: string) => {
    [k: string]: string;
};
/** RPC service name (standard OTEL: rpc.service) */
export declare const RpcService: (value: string) => {
    [k: string]: string;
};
/** RPC method name (standard OTEL: rpc.method) */
export declare const RpcMethod: (value: string) => {
    [k: string]: string;
};
/** Whether the error is retryable (workflow-specific) */
export declare const ErrorRetryable: (value: boolean) => {
    [k: string]: boolean;
};
/** Error category (workflow-specific: fatal, retryable, transient) */
export declare const ErrorCategory: (value: "fatal" | "retryable" | "transient") => {
    [k: string]: "fatal" | "retryable" | "transient";
};
//# sourceMappingURL=semantic-conventions.d.ts.map