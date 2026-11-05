import { z } from '#compiled/zod/index.js';
export type QueueKind = 'workflow';
/**
 * Pattern matching valid queue prefixes:
 * - `__wkf_workflow_` (default, no namespace)
 * - `__{namespace}_wkf_workflow_` (namespaced)
 *
 * Namespace must be lowercase alphanumeric starting with a letter.
 */
export declare const QueuePrefix: z.ZodString;
export type QueuePrefix = z.infer<typeof QueuePrefix>;
export declare const ValidQueueName: z.ZodString;
export type ValidQueueName = z.infer<typeof ValidQueueName>;
/**
 * Resolves the active queue namespace from an explicit argument or the
 * `WORKFLOW_QUEUE_NAMESPACE` env var.
 */
export declare function resolveQueueNamespace(namespace?: string): string | undefined;
/**
 * Builds the workflow queue topic prefix for an optional namespace.
 *
 * The literal kind argument is retained so existing workflow-only callers keep
 * their meaning after removal of the former `'step'` variant.
 *
 * - `getQueueTopicPrefix('workflow')` → `'__wkf_workflow_'`
 * - `getQueueTopicPrefix('workflow', 'custom')` → `'__custom_wkf_workflow_'`
 */
export declare function getQueueTopicPrefix(kind: QueueKind, namespace?: string): QueuePrefix;
/**
 * The route a World that delivers over HTTP sends a prefix's messages to when
 * no other route or handler is registered for that prefix (see
 * {@link Queue.registerRoute}): the Workflow SDK's generated flow route,
 * relative to the app's base URL.
 */
export declare const WORKFLOW_FLOW_ROUTE = "/.well-known/workflow/v1/flow";
/**
 * Validates a delivery route for {@link Queue.registerRoute}: an absolute path
 * on the app's base URL (`/api/agent/queue`), with no query or fragment.
 * Returns it unchanged.
 */
export declare function parseQueueRoute(path: string): string;
/**
 * The queue namespace a run's messages travel on, as recorded when the run was
 * created (`executionContext.queueNamespace`), or `undefined` when it recorded
 * none (or an invalid one), in which case the World's default namespace
 * applies. A World uses this to re-enqueue a run to its own consumer (see
 * `reenqueueActiveRuns`) rather than to the recovering process's prefix.
 */
export declare function getRunQueueNamespace(executionContext: unknown): string | undefined;
export declare function parseQueueName(name: ValidQueueName): {
    prefix: QueuePrefix;
    id: string;
};
export declare const MessageId: z.core.$ZodBranded<z.ZodString, "MessageId", "out">;
export type MessageId = z.infer<typeof MessageId>;
/**
 * OpenTelemetry trace context for distributed tracing
 */
export declare const TraceCarrierSchema: z.ZodRecord<z.ZodString, z.ZodString>;
export type TraceCarrier = z.infer<typeof TraceCarrierSchema>;
/**
 * Run creation data carried through the queue for resilient start.
 * Only present on the first queue delivery: re-enqueues omit this.
 * When the runtime processes the message, it passes this data to the
 * run_started event so the server can create the run if it doesn't exist yet.
 */
export declare const RunInputSchema: z.ZodObject<{
    input: z.ZodUnknown;
    deploymentId: z.ZodString;
    workflowName: z.ZodString;
    specVersion: z.ZodNumber;
    executionContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    dynamicWorkflowCode: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
    dynamicWorkflowCodeRef: z.ZodOptional<z.ZodString>;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    allowReservedAttributes: z.ZodOptional<z.ZodLiteral<true>>;
    encryptionPublicKey: z.ZodOptional<z.ZodString>;
    startHook: z.ZodOptional<z.ZodObject<{
        token: z.ZodString;
        hookId: z.ZodOptional<z.ZodString>;
        tokenRetentionUntil: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        metadata: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
    }, z.core.$strip>>;
    environment: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RunInput = z.infer<typeof RunInputSchema>;
/**
 * Legacy lazy hook resume data carried through the queue alongside a workflow
 * invocation. Older producers publish this invocation and write no event of
 * their own. On receipt, a consumer that understands `hookInput` idempotently
 * ensures the `hook_received` event exists (keyed by `resumeId`) before
 * replaying, so repeated deliveries converge on exactly one event.
 *
 * The `payload` is the already-serialized (and possibly encrypted) resume
 * payload, and on this path the queue message is its only carrier. Every write
 * derived from this message therefore hashes to the same digest under the
 * `(runId, resumeId)` constraint.
 */
/**
 * Resilient step dispatch data carried through the queue alongside a
 * step-execution message ({@link WorkflowInvokePayload.stepId}). Present when
 * the producer (the suspension handler dispatching a newly created step)
 * parallelized the `step_created` event write with the queue publish: the
 * same shape as resilient start (`runInput`) and the resilient hook resume
 * (`hookInput`).
 *
 * When the producer's `step_created` write fails transiently (429 / 5xx /
 * transport), the step entity may not exist when this message is consumed. A
 * consumer that understands `stepInput` idempotently re-ensures the
 * `step_created` event, keyed by the message's `stepId` (the step's
 * correlation id, unique per `(runId, correlationId)`), before executing, so
 * the producer's write and the consumer's re-ensure converge on exactly one
 * event.
 *
 * The `input` is the already-serialized (and possibly encrypted) step input:
 * the identical bytes the producer also sent on the direct `events.create`.
 *
 * The current `@workflow/core` runtime neither attaches nor reads this field:
 * it publishes a step message only after its `step_created` write. The schema
 * keeps accepting it so a message that carries it still parses.
 */
export declare const StepDispatchInputSchema: z.ZodObject<{
    input: z.ZodCustom<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>>;
}, z.core.$strip>;
export type StepDispatchInput = z.infer<typeof StepDispatchInputSchema>;
/**
 * Immutable run identity carried on a step-execution message so the consumer
 * can start the step without a blocking `runs.get` round trip. Every field is
 * fixed for the life of a run (runs are pinned to their deployment), and the
 * producer holds the run row at dispatch time, so the copy can never go
 * stale. Run *status* is deliberately NOT carried: liveness is enforced by
 * the `step_started` claim itself, which the World rejects on a terminal run.
 *
 * Consumers that need the full run row for inline replay
 * still fetch it lazily; messages without this field (older producers) take
 * the legacy `runs.get` prologue.
 */
export declare const RunDispatchContextSchema: z.ZodObject<{
    deploymentId: z.ZodString;
    specVersion: z.ZodNumber;
    startedAt: z.ZodOptional<z.ZodNumber>;
    rootRunId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RunDispatchContext = z.infer<typeof RunDispatchContextSchema>;
export declare const HookResumeInputSchema: z.ZodObject<{
    resumeId: z.ZodString;
    hookId: z.ZodString;
    token: z.ZodString;
    payload: z.ZodUnknown;
    payloadDigest: z.ZodString;
    deploymentId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type HookResumeInput = z.infer<typeof HookResumeInputSchema>;
/**
 * Wall-clock boundaries of a hook-triggered resume, carried on the queue
 * message so the SDK can report end-to-end time-to-resume (TTR, entry into
 * `resumeHook()` through to the first line of the next durable step) and its
 * non-overlapping phase breakdown, as span attributes on that step's
 * `step.execute` span. See `runtime/resume-latency.ts` in `@workflow/core`.
 *
 * Two groups of fields:
 *
 * - Producer fields (`resumeRequestedAtMs`, `queuePublishRequestedAtMs`,
 *   `strategy`) are stamped by `resumeHook()` on the invocation message. They
 *   ride along on a deployment-affinity re-route unchanged, so a misrouted
 *   delivery's extra hop stays inside `queue_delivery`.
 * - Consumer fields (`consumerStartedAtMs`, `replayStartedAtMs`,
 *   `nextStepEncounteredAtMs`, `setupSource`) are filled in by the invocation
 *   that replayed the resume, and ONLY when it dispatches the next durable
 *   step to a separate queue invocation instead of running it inline. They let
 *   that invocation report the same single TTR measurement.
 *
 * Every field is advisory and the whole object is optional, in all three
 * directions that matter for a rolling deploy: a new producer's timing is
 * ignored by an old consumer, a new consumer reports no TTR for an old
 * message, and workflow-server never reads it at all.
 *
 * `strategy` and `setupSource` are deliberately typed as plain strings rather
 * than enums: an unrecognized value from a newer producer must not fail the
 * parse of the whole invocation payload (which would wedge the run), since it
 * is only ever forwarded to a span attribute.
 */
export declare const HookResumeTimingSchema: z.ZodObject<{
    resumeRequestedAtMs: z.ZodNumber;
    queuePublishRequestedAtMs: z.ZodNumber;
    strategy: z.ZodOptional<z.ZodString>;
    consumerStartedAtMs: z.ZodOptional<z.ZodNumber>;
    replayStartedAtMs: z.ZodOptional<z.ZodNumber>;
    nextStepEncounteredAtMs: z.ZodOptional<z.ZodNumber>;
    setupSource: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type HookResumeTiming = z.infer<typeof HookResumeTimingSchema>;
export declare const WorkflowInvokePayloadSchema: z.ZodObject<{
    runId: z.ZodString;
    runSpecVersion: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
    recovery: z.ZodCatch<z.ZodOptional<z.ZodLiteral<true>>>;
    invoke: z.ZodOptional<z.ZodLiteral<true>>;
    requestId: z.ZodOptional<z.ZodString>;
    input: z.ZodOptional<z.ZodUnknown>;
    traceCarrier: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    requestedAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    replayDivergence: z.ZodOptional<z.ZodObject<{
        eventId: z.ZodString;
        count: z.ZodNumber;
        eventIds: z.ZodCatch<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    }, z.core.$strip>>;
    preconditionReinvocations: z.ZodOptional<z.ZodNumber>;
    serverErrorRetryCount: z.ZodOptional<z.ZodNumber>;
    deploymentMismatchRetryCount: z.ZodOptional<z.ZodNumber>;
    waitContinuation: z.ZodCatch<z.ZodOptional<z.ZodObject<{
        correlationId: z.ZodString;
        attempt: z.ZodNumber;
        resumeAtMs: z.ZodOptional<z.ZodNumber>;
        hopAtMs: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
    completeWaits: z.ZodCatch<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    stepId: z.ZodOptional<z.ZodString>;
    stepName: z.ZodOptional<z.ZodString>;
    stepAttempt: z.ZodOptional<z.ZodNumber>;
    stepResent: z.ZodOptional<z.ZodBoolean>;
    stepCreatedEventId: z.ZodOptional<z.ZodString>;
    stepCreatedAt: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
    runInput: z.ZodOptional<z.ZodObject<{
        input: z.ZodUnknown;
        deploymentId: z.ZodString;
        workflowName: z.ZodString;
        specVersion: z.ZodNumber;
        executionContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        dynamicWorkflowCode: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        dynamicWorkflowCodeRef: z.ZodOptional<z.ZodString>;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        allowReservedAttributes: z.ZodOptional<z.ZodLiteral<true>>;
        encryptionPublicKey: z.ZodOptional<z.ZodString>;
        startHook: z.ZodOptional<z.ZodObject<{
            token: z.ZodString;
            hookId: z.ZodOptional<z.ZodString>;
            tokenRetentionUntil: z.ZodOptional<z.ZodCoercedDate<unknown>>;
            metadata: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        }, z.core.$strip>>;
        environment: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    hookInput: z.ZodOptional<z.ZodObject<{
        resumeId: z.ZodString;
        hookId: z.ZodString;
        token: z.ZodString;
        payload: z.ZodUnknown;
        payloadDigest: z.ZodString;
        deploymentId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    stepInput: z.ZodOptional<z.ZodObject<{
        input: z.ZodCustom<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>>;
    }, z.core.$strip>>;
    runContext: z.ZodOptional<z.ZodObject<{
        deploymentId: z.ZodString;
        specVersion: z.ZodNumber;
        startedAt: z.ZodOptional<z.ZodNumber>;
        rootRunId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    hookResumeTiming: z.ZodCatch<z.ZodOptional<z.ZodObject<{
        resumeRequestedAtMs: z.ZodNumber;
        queuePublishRequestedAtMs: z.ZodNumber;
        strategy: z.ZodOptional<z.ZodString>;
        consumerStartedAtMs: z.ZodOptional<z.ZodNumber>;
        replayStartedAtMs: z.ZodOptional<z.ZodNumber>;
        nextStepEncounteredAtMs: z.ZodOptional<z.ZodNumber>;
        setupSource: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type WorkflowInvokePayload = z.infer<typeof WorkflowInvokePayloadSchema>;
export type HealthCheckPayload = z.infer<typeof HealthCheckPayloadSchema>;
/**
 * Health check payload - used to verify that the queue pipeline
 * can deliver messages to the combined workflow endpoint.
 */
export declare const HealthCheckPayloadSchema: z.ZodObject<{
    __healthCheck: z.ZodLiteral<true>;
    correlationId: z.ZodString;
    probeRunId: z.ZodOptional<z.ZodString>;
    runId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Health check MUST come first.
 *
 * Zod unions return the first matching member's output, and `z.object` strips
 * keys the matching member doesn't declare. A probe from an older caller can
 * carry the legacy `runId`, which also satisfies `WorkflowInvokePayloadSchema`
 * (whose only required field is `runId`). With the invoke member first,
 * parsing such a probe silently drops `__healthCheck` and `correlationId`, and
 * the runtime (which dispatches on `__healthCheck` before falling through to
 * the invoke schema) reinterprets the probe as "replay this run".
 *
 * Ordering health check first is safe in the other direction: it requires
 * `__healthCheck: true`, which an invoke payload never carries.
 */
export declare const QueuePayloadSchema: z.ZodUnion<readonly [z.ZodObject<{
    __healthCheck: z.ZodLiteral<true>;
    correlationId: z.ZodString;
    probeRunId: z.ZodOptional<z.ZodString>;
    runId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    runId: z.ZodString;
    runSpecVersion: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
    recovery: z.ZodCatch<z.ZodOptional<z.ZodLiteral<true>>>;
    invoke: z.ZodOptional<z.ZodLiteral<true>>;
    requestId: z.ZodOptional<z.ZodString>;
    input: z.ZodOptional<z.ZodUnknown>;
    traceCarrier: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    requestedAt: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    replayDivergence: z.ZodOptional<z.ZodObject<{
        eventId: z.ZodString;
        count: z.ZodNumber;
        eventIds: z.ZodCatch<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    }, z.core.$strip>>;
    preconditionReinvocations: z.ZodOptional<z.ZodNumber>;
    serverErrorRetryCount: z.ZodOptional<z.ZodNumber>;
    deploymentMismatchRetryCount: z.ZodOptional<z.ZodNumber>;
    waitContinuation: z.ZodCatch<z.ZodOptional<z.ZodObject<{
        correlationId: z.ZodString;
        attempt: z.ZodNumber;
        resumeAtMs: z.ZodOptional<z.ZodNumber>;
        hopAtMs: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
    completeWaits: z.ZodCatch<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    stepId: z.ZodOptional<z.ZodString>;
    stepName: z.ZodOptional<z.ZodString>;
    stepAttempt: z.ZodOptional<z.ZodNumber>;
    stepResent: z.ZodOptional<z.ZodBoolean>;
    stepCreatedEventId: z.ZodOptional<z.ZodString>;
    stepCreatedAt: z.ZodCatch<z.ZodOptional<z.ZodNumber>>;
    runInput: z.ZodOptional<z.ZodObject<{
        input: z.ZodUnknown;
        deploymentId: z.ZodString;
        workflowName: z.ZodString;
        specVersion: z.ZodNumber;
        executionContext: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        dynamicWorkflowCode: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        dynamicWorkflowCodeRef: z.ZodOptional<z.ZodString>;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        allowReservedAttributes: z.ZodOptional<z.ZodLiteral<true>>;
        encryptionPublicKey: z.ZodOptional<z.ZodString>;
        startHook: z.ZodOptional<z.ZodObject<{
            token: z.ZodString;
            hookId: z.ZodOptional<z.ZodString>;
            tokenRetentionUntil: z.ZodOptional<z.ZodCoercedDate<unknown>>;
            metadata: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
        }, z.core.$strip>>;
        environment: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    hookInput: z.ZodOptional<z.ZodObject<{
        resumeId: z.ZodString;
        hookId: z.ZodString;
        token: z.ZodString;
        payload: z.ZodUnknown;
        payloadDigest: z.ZodString;
        deploymentId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    stepInput: z.ZodOptional<z.ZodObject<{
        input: z.ZodCustom<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>>;
    }, z.core.$strip>>;
    runContext: z.ZodOptional<z.ZodObject<{
        deploymentId: z.ZodString;
        specVersion: z.ZodNumber;
        startedAt: z.ZodOptional<z.ZodNumber>;
        rootRunId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    hookResumeTiming: z.ZodCatch<z.ZodOptional<z.ZodObject<{
        resumeRequestedAtMs: z.ZodNumber;
        queuePublishRequestedAtMs: z.ZodNumber;
        strategy: z.ZodOptional<z.ZodString>;
        consumerStartedAtMs: z.ZodOptional<z.ZodNumber>;
        replayStartedAtMs: z.ZodOptional<z.ZodNumber>;
        nextStepEncounteredAtMs: z.ZodOptional<z.ZodNumber>;
        setupSource: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>]>;
export type QueuePayload = z.infer<typeof QueuePayloadSchema>;
/**
 * The run whose orchestrator a queue message is a delivery for, or
 * `undefined` when the message is not an orchestrator delivery.
 *
 * An orchestrator delivery is a {@link WorkflowInvokePayload} without a
 * `stepId`: the start of a run, a wake after a step outcome, a hook resume,
 * a cancellation or a timer. A step execution message (`stepId` set), a
 * health check (`__healthCheck`, which may carry the `runId` it prepares)
 * and an intermediate hop of a long wait's timer
 * ({@link isIntermediateWaitHop}) are not, and keep full parallelism.
 *
 * A run's orchestrator deliveries are serialized only on single-orchestrator
 * runs (spec >= 9, see {@link singleOrchestratorRunIdOf}).
 */
export declare function orchestratorRunIdOf(payload: unknown): string | undefined;
/**
 * Whether a queue message is an intermediate hop of a long wait's timer
 * chain: a timer the runtime sends to fire before its wait is due, because
 * the wait is longer than one queue delay, so that the delivery sends the
 * next hop. Marked by `waitContinuation.resumeAtMs`, which only such a hop
 * carries.
 *
 * Its delivery is not an orchestrator delivery: it reads only the run's
 * status, writes nothing, sends the next hop (the last one an ordinary
 * timer) and acknowledges. So it is never serialized behind, or coalesced
 * into, a delivery of its run ({@link orchestratorRunIdOf} leaves it out),
 * and it must not be: a coalesced hop is never delivered, and the holder's
 * re-run, which finds its wait not yet due, would not send the next one.
 */
export declare function isIntermediateWaitHop(payload: unknown): boolean;
/**
 * The spec version of the run a queue message belongs to, as the message
 * says it: a first delivery's `runInput.specVersion`, a step message's
 * `runContext.specVersion`, or the `runSpecVersion` hint the runtime stamps
 * on every other message of a run. `undefined` for a health check, a
 * message without a run, and a message from a producer that predates the
 * fields. A World treats `undefined` as a run below spec 9: every runtime
 * that creates spec 9 runs stamps its messages.
 *
 * A producer outside that runtime (an older SDK, or another client of the
 * World) may still send a message for a spec 9 run that is unstamped or
 * stamped below 9, and nothing can prevent it. The World then treats it as a
 * message of an earlier run: world-vercel sends it without the run's
 * concurrency key, and world-local and world-postgres do not serialize it, so
 * it can run beside the run's serialized orchestrator. The runtime still
 * routes it to the run's orchestrator (from the run itself, or by handing it
 * on once the run is loaded), and the in-band fence refuses the second
 * writer's in-band writes, so the run's log stays correct. The cost is wasted
 * orchestrator work, which can include running the body of an inline step a
 * second time; it does not corrupt the log.
 */
export declare function messageRunSpecVersion(payload: unknown): number | undefined;
/**
 * Whether a queue message belongs to a single-orchestrator run (spec >= 9),
 * by {@link messageRunSpecVersion}. The handler-result semantics of
 * {@link Queue.createQueueHandler} and per-run serialization apply to these
 * messages; a message of an earlier run keeps the World's earlier behavior.
 */
export declare function isSingleOrchestratorMessage(payload: unknown): boolean;
/**
 * The run whose orchestrator deliveries a World serializes for this message:
 * {@link orchestratorRunIdOf} for a message of a single-orchestrator run
 * (spec >= 9), else `undefined`.
 *
 * A World serializes these per run: at most one delivery for a given run id
 * is in flight at a time, the others wait behind it, and step messages are
 * never held back by it. That is the queue half of the single-writer
 * guarantee; the in-band fence is the other half, and makes an overlap that
 * the queue still lets through (a delivery that outlives its lease) safe.
 *
 * Messages of earlier runs (spec <= 8) are not serialized: a spec 8
 * orchestrator can hold an inline step until another wake of the same run
 * aborts it, and run-level exclusion would hold that wake back.
 */
export declare function singleOrchestratorRunIdOf(payload: unknown): string | undefined;
/**
 * What a single-orchestrator continuation message takes from the message it
 * replaces, field by field of {@link WorkflowInvokePayload} (see
 * {@link singleOrchestratorContinuationPayload}). Typed as a record of every
 * payload field, so a new field fails the typecheck until it is classified
 * here.
 *
 * - `'carry'`: copied. The run (`runId`), its identity on step messages
 *   (`runContext`), the trace link (`traceCarrier`), and what the message is
 *   a wake for: the wait a timer is for (`waitContinuation`), the waits a
 *   `run.wakeUp()` names (`completeWaits`), and a legacy hook resume
 *   (`hookInput`, which the orchestrator writes deduplicated by its
 *   `resumeId`, so a second copy writes nothing).
 * - `'stamp'`: `runSpecVersion`, set to the spec version the replaced
 *   message carried in any of its fields ({@link messageRunSpecVersion}), so
 *   the continuation is routed and serialized as the run's other messages
 *   are, even though it drops `runInput`.
 * - `'drop'`: not copied. `runInput` marks the run's first orchestrator
 *   message, and with a first delivery count it is what selects the
 *   runtime's fresh-start path, which assumes a log holding only
 *   `run_created`; a continuation always continues a progressed run.
 *   `requestedAt` and `hookResumeTiming` measure the request that sent the
 *   replaced message. `recovery` asks a delivery to re-send everything a lost
 *   queue held, which the replaced message's delivery did. `invoke`,
 *   `requestId` and `input` are a request/response invocation, not a
 *   continuation. The retry counters (`replayDivergence`,
 *   `preconditionReinvocations`, `serverErrorRetryCount`,
 *   `deploymentMismatchRetryCount`) belong to runs below spec 9 or to one
 *   chain of re-enqueues. The step fields (`stepId` and the rest) are never
 *   on an orchestrator message.
 */
export declare const SINGLE_ORCHESTRATOR_CONTINUATION_FIELDS: {
    readonly runId: "carry";
    readonly runContext: "carry";
    readonly traceCarrier: "carry";
    readonly waitContinuation: "carry";
    readonly completeWaits: "carry";
    readonly hookInput: "carry";
    readonly runSpecVersion: "stamp";
    readonly runInput: "drop";
    readonly requestedAt: "drop";
    readonly hookResumeTiming: "drop";
    readonly recovery: "drop";
    readonly invoke: "drop";
    readonly requestId: "drop";
    readonly input: "drop";
    readonly replayDivergence: "drop";
    readonly preconditionReinvocations: "drop";
    readonly serverErrorRetryCount: "drop";
    readonly deploymentMismatchRetryCount: "drop";
    readonly stepId: "drop";
    readonly stepName: "drop";
    readonly stepAttempt: "drop";
    readonly stepResent: "drop";
    readonly stepCreatedEventId: "drop";
    readonly stepCreatedAt: "drop";
    readonly stepInput: "drop";
};
/**
 * The payload a World sends when it continues a single-orchestrator run's
 * orchestrator message on a new message instead of handing it off (as
 * world-vercel does for a message close to its expiry), or `undefined` when
 * `payload` is not an orchestrator message of a single-orchestrator run
 * ({@link singleOrchestratorRunIdOf}), which a World hands off instead.
 *
 * Built from an explicit list of fields
 * ({@link SINGLE_ORCHESTRATOR_CONTINUATION_FIELDS}), never by copying: the
 * replaced message may be the run's start message, and a copy of its
 * `runInput` on a message delivered for the first time would take the
 * runtime's fresh-start path over a log that already holds the run's
 * progress, and could run completed step bodies again.
 */
export declare function singleOrchestratorContinuationPayload(payload: unknown): WorkflowInvokePayload | undefined;
/**
 * The shortest time, in milliseconds, a World's queue must deduplicate sends
 * that carry a single-orchestrator run's step key
 * (`QueueOptions.idempotencyKey` on a step's execution message): for at
 * least this long after the key's first send, while the message that send
 * made lives (held, delayed, being delivered or in retry backoff), every
 * later send under the key is a no-op. The runtime sends a step's message
 * again from later deliveries of its run (see `Queue.createQueueHandler`)
 * only while the step's last send is this young, less a margin, so each such
 * re-send is deduplicated against the step's live message instead of giving
 * the step a second owner.
 *
 * A re-send is decided from the log its delivery loaded, which can be older
 * than the step's progress: the step's message may have been delivered, run
 * the step to its outcome and been acknowledged since. A World is not
 * required to keep the key past the acknowledgment, nor to refuse a
 * `step_started` for a step that already has an outcome. The runtime marks a
 * re-sent message (`stepResent`), and its handler reads the run's log before
 * it runs the body, even on the message's first delivery, so a re-send the
 * queue takes as a new message after the step's outcome acknowledges without
 * running it. A World that does either of the two still gets the same result
 * without that read.
 *
 * world-vercel keeps a key for `min(retention, 24h)` whether or not its
 * message was acknowledged, and retains a step message for at least this
 * long. world-local and world-postgres keep it while the first message lives
 * (world-postgres: while its job exists, with Graphile's `unsafe_dedupe`),
 * which a step message outlives only by completing, and both refuse a
 * `step_started` for a step that already has an outcome.
 */
export declare const QUEUE_MIN_STEP_KEY_DEDUPE_WINDOW_MS: number;
/**
 * How long, in milliseconds, a single-orchestrator run's step message whose
 * deliveries keep failing must go on being redelivered at least, from its
 * first delivery. A delivery that throws before it writes anything (the
 * step's input cannot be read, say) leaves the step's log as it was; past
 * the runtime's delivery cap, a delivery that finds the step's log showing
 * no activity for this long fails the step (`MAX_DELIVERIES_EXCEEDED`) and
 * wakes the run. A queue that gives up on the message sooner strands the
 * run. world-vercel retains a step message for at least a day; world-local
 * backs off its retries so that its safety limit lasts longer than this;
 * world-postgres keeps retrying a job without a time limit.
 */
export declare const QUEUE_MIN_STEP_REDELIVERY_SPAN_MS: number;
export interface QueueOptions {
    deploymentId?: string;
    /**
     * Deduplicates sends that carry the same key while the first message with
     * that key exists (on Vercel Queues: for `min(retention, 24h)`).
     *
     * On a spec 9 run's messages the runtime sets it on a step's execution
     * message, with a key stable for the step, because a second message for a
     * step would be a second owner of its body.
     *
     * Every wake of a spec 9 run's orchestrator (after a background step's
     * outcome, `resumeHook()`, `cancel()`, a force-claimed hook, a fence
     * refusal) carries no key: a duplicate wake costs one cheap delivery,
     * while a key can be absorbed by a delivery that is already exiting and
     * lose the wakeup. A wait's timer is the exception. Each hop of it carries
     * `wait:<correlationId>:<resumeAt>:<hopAt>`, the wait, its deadline and the
     * hop's own deadline (epoch ms; hops are anchored on the wait's deadline),
     * so the timers that a message's first delivery and every sender of an
     * intermediate hop send for the same hop are one message; a re-arm after a
     * timer that came before its wait was due appends `:a<attempt>`. A
     * delivery that may hold a coalesced timer (any but its message's first)
     * keys a wait's last hop by its second instead (the near-due key below),
     * so a redelivery of a delivery that sent a wait's last hop and then failed
     * can add one duplicate timer. The duplicate finds its wait completed, or
     * re-arms it. A near-due re-arm, the timer a delivery that may
     * hold a coalesced timer sends for an open wait due within a few seconds,
     * whatever its chain, carries `wait:<correlationId>:<resumeAt>:s<second>`,
     * the sender's second in place of the hop's deadline. Deduplicate these as
     * you do a step's key.
     * Wakes of runs below spec 9 keep their earlier keys (`hook-<resumeId>`,
     * `hook-force-claim-<hookId>`, the QuickJS engine's
     * `hook_conflict_<correlationId>`).
     */
    idempotencyKey?: string;
    /**
     * How long the message may live, in seconds, including every redelivery.
     * Set on step messages so that the message outlives its step's whole retry
     * span (the step is retried in place on the same message). A World caps it
     * at what its queue supports (Vercel Queues: 7 days) and uses its default
     * when it is absent.
     */
    retentionSeconds?: number;
    headers?: Record<string, string>;
    /** Delay message delivery by this many seconds */
    delaySeconds?: number;
    /** Spec version of the target run. Used to select the queue transport format. */
    specVersion?: number;
    /**
     * World-specific routing hint identifying the region the message should
     * be sent to (e.g. a Vercel compute region code such as `'iad1'`).
     *
     * Worlds that don't have a regional dimension ignore this field. For
     * `@workflow/world-vercel`, this overrides the region the underlying
     * `@vercel/queue` client uses to route the message; when omitted, the
     * region is resolved from the payload's tagged run ID, then from the
     * `VERCEL_REGION` environment variable, and finally defaults to `'iad1'`
     * (the pre-regional-routing behavior).
     */
    region?: string;
}
/**
 * Outcome of one message in a {@link Queue.queueBatch} call, in input order.
 *
 * `messageId: null` with no `error` means accepted for deferred processing
 * (the same "accepted, no ID yet" case {@link Queue.queue} reports), so
 * `error === undefined` is the success test, not a non-null `messageId`.
 */
export type QueueBatchResult = {
    messageId: MessageId | null;
    error?: undefined;
} | {
    messageId: null;
    /** Human-readable failure description for this message. */
    error: string;
    /** Republishing the batch may succeed. */
    retryable: boolean;
};
export interface InvokeOptions {
    /** Retries of one request reuse this key and the exact same payload. */
    idempotencyKey?: string;
    /** Maximum time to await a response. Timeout does not undo processing. */
    timeoutMs?: number;
}
export interface Queue {
    getDeploymentId(): Promise<string>;
    /**
     * Send an invocation to a run's executor. Must be enabled via capabilities.invoke.
     * An invocation carries an out-of-band request that must be processed by the
     * executor. The executor's response is propagated back and errors are rethrown
     * by invoke(). A transport error is an unknown outcome: the request may have
     * been successfully processed by the executor, for example, and the success
     * result may be lost.
     */
    invoke?(runId: string, payload: unknown, options?: InvokeOptions): Promise<unknown>;
    /**
     * Returns true only when a queue error definitively means the explicitly
     * targeted deployment cannot receive the message. Unknown and transient
     * errors must return false so the current delivery can be retried safely.
     */
    isDeploymentUnavailableError?(error: unknown): boolean;
    /**
     * Enqueues a message to the specified queue.
     *
     * @param queueName - The name of the queue to which the message will be sent.
     * @param message - The content of the message to be sent to the queue.
     * @param opts - Optional parameters for the queue operation.
     */
    queue(queueName: ValidQueueName, message: QueuePayload, opts?: QueueOptions): Promise<{
        messageId: MessageId | null;
    }>;
    /**
     * Enqueues several messages to the SAME logical queue in as few round trips
     * as the backing transport allows. Optional: callers MUST fall back to
     * per-message {@link Queue.queue} when a World does not implement it.
     *
     * Exists for wide fan-outs. Publishing an N-branch `Promise.all` one message
     * at a time costs N round trips through a bounded connection pool, and that
     * cost is paid before the fan-out's first step body runs, so it lands
     * directly on time-to-first-step.
     *
     * Contract:
     *
     * - Results are returned in input order, one per input message. Returning
     *   a different number of results than there were messages is a contract
     *   violation the runtime rejects the whole batch on: an omitted result is
     *   indistinguishable from a message that was never published, and reading
     *   it as success would strand that step with no error anywhere.
     * - Partial failure is normal. A rejected entry reports `error`; a
     *   `retryable` entry may succeed if the whole batch is published again.
     *   Implementations MUST NOT throw for a per-entry failure — reserve
     *   rejection for request-level failures where no entry outcome is known.
     * - Callers are expected to pass `opts.idempotencyKey` per message, because
     *   the recovery for both a request-level failure and a retryable entry is
     *   to republish the batch: without keys that redelivers the entries that
     *   already succeeded.
     * - Every message must target one logical `queueName`. Implementations are
     *   free to split the batch (by transport cap, or by any per-message routing
     *   dimension they derive from the payload, such as region or physical
     *   topic); the split must not be observable in the returned order.
     */
    queueBatch?(queueName: ValidQueueName, messages: readonly {
        message: QueuePayload;
        opts?: QueueOptions;
    }[]): Promise<QueueBatchResult[]>;
    /**
     * Creates an HTTP queue handler for processing messages from a specific queue.
     *
     * Handler outcomes, for a message that is not an `invoke: true` request.
     * What a `{ timeoutSeconds }` result asks for depends on the run the
     * message belongs to ({@link isSingleOrchestratorMessage}):
     *
     * - **Single-orchestrator run (spec >= 9), `{ timeoutSeconds: n }` with
     *   `n > 0`**: do NOT acknowledge the message. Deliver the SAME message
     *   again (same `messageId`, next `deliveryCount`) after about `n` seconds.
     *   The runtime returns this from a step handler to retry a step in place
     *   after `retryAfter`, and from an orchestrator delivery to defer the run
     *   (an inline step start refused for load) or to stand down after the
     *   in-band fence refused its write, whose redelivery must count as one
     *   (next `deliveryCount`) so that it re-sends what a delivery that died
     *   left unsent. A World MAY clamp `n` to what
     *   its queue supports (Vercel Queues clamps a redelivery delay to
     *   [5s, 900s]); the runtime tolerates an early redelivery by checking the
     *   log and asking again. A World whose queue cannot redeliver the same
     *   message may publish a new message with the same payload instead,
     *   provided it carries the same `messageId` and the next `deliveryCount`
     *   in `meta` on delivery; otherwise the runtime's re-send rule loses its
     *   anchor (see `meta.deliveryCount`).
     * - **Single-orchestrator run, `{ timeoutSeconds: 0 }`: a handoff.** The
     *   delivery is not done and continues in a fresh one. Deliver the SAME
     *   message again at once, and do not count this delivery toward
     *   `attempt`. The orchestrator returns this when its invocation must end
     *   before its work does (the invocation deadline, a stream flush, the
     *   replay budget, a wait or a write it cannot read yet). The runtime never
     *   returns it where the next delivery has to count as an attempt: a
     *   fence-refused delivery sends what its writes owe and returns
     *   `{ timeoutSeconds: n }` with `n > 0`. A World should not treat a non-finite
     *   `n` as a handoff (a handoff is not an attempt, so a handler that kept
     *   returning one would never stop); world-vercel redelivers after its
     *   longest delay.
     * - **Earlier runs (spec <= 8), `{ timeoutSeconds: n }`**: continue the run
     *   after about `n` seconds (`0`: at once), by redelivering the same message
     *   or by publishing a new message with the same payload. world-vercel
     *   publishes a new message, with up to 23 hours of delay, before it
     *   acknowledges this one; world-local and world-postgres redeliver.
     * - **Resolves with anything else**: acknowledge the message.
     * - **Rejects**: retry the same message, with a World-chosen backoff.
     *
     * With `invoke: true`, the return value is response data delivered by the
     * World and is never queue control.
     *
     * `meta` describes the delivery:
     *
     * - `messageId` SHOULD be stable across redeliveries of the same message
     *   (one id per enqueued message, reused on every delivery), and MUST be
     *   for a World that creates spec 9 runs. On a spec 9 run the runtime
     *   records it on `step_created` and `wait_created` (`creatorMessageId`):
     *   the delivery that wrote a wait's `wait_created`, or a later delivery of
     *   that message, schedules the wait's timer. On earlier runs the runtime's
     *   inline step ownership uses it as a liveness lease: the lazy
     *   `step_started` records the handling invocation's messageId, and only a
     *   delivery of that same message may re-execute the step before the
     *   ownership lease expires. A World whose queue mints a fresh id per
     *   delivery degrades gracefully there: owner redeliveries fall back to the
     *   delayed-backstop path, adding recovery latency but never wedging or
     *   duplicating.
     * - `deliveryCount` is 1 on a message's first delivery and increments on
     *   every redelivery, whatever caused it (lease lapse, a rejected handler, a
     *   `{ timeoutSeconds }` result, a handoff, a coalesced re-run). An
     *   orchestrator delivery whose count is above 1 re-sends, once per
     *   invocation and under each step's stable key, every background step
     *   that has a `step_created` and no `step_started`: a delivery that died
     *   between the two left it with no message. The queue must therefore
     *   follow any delivery that dies with a delivery counted above 1, of the
     *   same message or of one it was coalesced into, and must dedupe a step
     *   key for at least {@link QUEUE_MIN_STEP_KEY_DEDUPE_WINDOW_MS} while the
     *   step's first message lives. Leave it `undefined`
     *   when the queue cannot say: the runtime then treats every delivery as a
     *   possible redelivery and reads the run's log before running a step
     *   body, which is correct but slower. A queue that reports 1 for a redelivery breaks
     *   the at-most-once guarantee of a `maxRetries: 0` step.
     * - `createdAt` is when the message was first enqueued, when known.
     * - `attempt` is `deliveryCount` less the deliveries that followed a
     *   handoff (`{ timeoutSeconds: 0 }` on a single-orchestrator run) and less
     *   coalesced re-runs (below). It is what the runtime's delivery cap
     *   counts. On a World with neither it equals `deliveryCount`.
     * - A World whose queue coalesces a run's orchestrator messages into the
     *   delivery that is running (world-vercel, with `@vercel/queue`'s
     *   experimental concurrency key) runs the handler again within that
     *   delivery when coalesced messages arrived while it ran. Each such
     *   re-run reports the next `deliveryCount` (the delivery's count plus the
     *   re-runs so far) and leaves `attempt` unchanged: a coalesced message is
     *   never delivered, so a re-run must read the run's log, as a redelivery
     *   does, and whatever those messages were sent for was committed to the
     *   log before they were sent. Two orchestrator payload fields carry more
     *   than the log. `run.wakeUp()`'s `completeWaits` is best-effort:
     *   coalesced, it is lost, and the waits run their full length. A timer's
     *   `waitContinuation` names its wait: coalesced, the name is lost, which
     *   costs nothing for a final timer (the holder's re-run sees the wait due
     *   and completes it, and the delivery that completes a wait arms the next
     *   one of its chain), and an intermediate hop of a long wait, which would
     *   lose its chain, is never coalesced ({@link isIntermediateWaitHop}).
     * - `invocationStartedAt` (epoch ms) is when the function invocation running
     *   this handler call began, when the World knows it. It is the same for
     *   every coalesced re-run of a delivery, which all share that invocation:
     *   the runtime measures its inline deadline from it, so a late re-run does
     *   not get a fresh budget the invocation no longer has. Absent: the runtime
     *   measures from the start of each handler call.
     */
    createQueueHandler(queueNamePrefix: QueuePrefix, handler: (message: unknown, meta: {
        attempt: number;
        deliveryCount?: number;
        createdAt?: Date;
        queueName: ValidQueueName;
        messageId: MessageId;
        requestId?: string;
        invocationStartedAt?: number;
    }) => Promise<unknown>): (req: Request) => Promise<Response>;
    /**
     * Optional. Delivers every message whose queue name starts with `prefix` to
     * `handler` inside this process, without HTTP. For Worlds whose queue runs
     * in the app's own process (world-local, world-postgres). `handler` takes
     * the same request a route serving `createQueueHandler(prefix, ...)` would,
     * so passing that route handler works. Takes precedence over
     * {@link Queue.registerRoute} for the prefix; a later registration for the
     * same prefix replaces an earlier one.
     *
     * Keyed by the exact prefix: registering `__wkf_workflow_` also takes the
     * Workflow SDK's own messages. A queue consumer other than the Workflow SDK
     * uses a prefix of its own, `__{namespace}_wkf_workflow_`.
     */
    registerHandler?(prefix: QueuePrefix, handler: (req: Request) => Promise<Response>): void;
    /**
     * Optional. The route (a path on the app's base URL, such as
     * `/api/agent/queue`) that this World's HTTP delivery POSTs the messages of
     * `prefix` to. The app serves it with `createQueueHandler(prefix, ...)`.
     * A prefix without a registered route goes to the Workflow SDK's flow route
     * ({@link WORKFLOW_FLOW_ROUTE}), so only the Workflow SDK relies on that
     * path, and a queue consumer of its own registers its route here, before
     * the World's `start()` when it has one (`start()` re-enqueues active runs).
     * An in-process handler for the prefix ({@link Queue.registerHandler})
     * takes precedence; a later registration for the same prefix replaces an
     * earlier one.
     *
     * Worlds that deliver by subscription rather than by path (world-vercel)
     * do not implement this: subscribe the route to the prefix's topics there.
     */
    registerRoute?(prefix: QueuePrefix, path: string): void;
}
//# sourceMappingURL=queue.d.ts.map