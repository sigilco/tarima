import type { CreateEventParams, CreateEventRequest, Event, EventLogSnapshot, EventResult, HealthCheckPayload, RunDispatchContext, ValidQueueName, WorkflowRun, World, WorldCapabilities } from '#compiled/@workflow/world/index.js';
import { type PayloadKey } from '../serialization/encryption.js';
/**
 * Validates a workflow name and returns the corresponding queue name.
 * Ensures the workflow name only contains safe characters before
 * interpolating it into the queue name string.
 */
export declare function getWorkflowQueueName(workflowName: string, namespace?: string): ValidQueueName;
/** Version of the dynamic-workflow runtime contract advertised by deployments. */
export declare const DYNAMIC_WORKFLOW_VERSION = 1;
/**
 * Result of a health check operation.
 */
export interface HealthCheckResult {
    healthy: boolean;
    /** Error message if health check failed */
    error?: string;
    /** Latency if the health check was successful */
    latencyMs?: number;
    /** Spec version of the responding deployment */
    specVersion?: number;
    /**
     * `@workflow/core` version of the responding deployment, used for
     * capability detection (see `getRunCapabilities`). Omitted when the
     * responding deployment did not provide the field as a string:
     * for example, an older `@workflow/core` that predates this field,
     * or a non-JSON plain-text health response.
     */
    workflowCoreVersion?: string;
    /**
     * Node.js version of the responding deployment, used for capability
     * detection (zstd decoding depends on it; see `getRunCapabilities`).
     * Omitted when the responder predates this field or is not Node.js.
     */
    nodeVersion?: string;
    /**
     * The target run's X25519 public key (base64), returned only when the probe
     * carried a `runId` and the responding deployment has encryption enabled.
     *
     * Lets a cross-deployment `start()` seal the workflow arguments using a
     * response it was already waiting on, instead of making a separate
     * key-lookup request.
     */
    encryptionPublicKey?: string;
    /**
     * The responding deployment's `HOOK_RESUME_INPUT_VERSION`: the protocol
     * version at which the *consumer* (queue-message target) materializes the
     * `hook_received` event from `hookInput` on replay. A cross-deployment
     * `start()` stamps the *target's* value (not the caller's) into the new
     * run's `executionContext.hookResumeInputVersion`. Current producers write
     * the event durably before publishing the wake and do not read the marker;
     * OLDER producers still gate their lazy path on it, so it keeps being
     * stamped. Omitted when the responding deployment predates this field,
     * which fails that gate closed.
     */
    hookResumeInputVersion?: number;
    /**
     * The responding deployment's `CHILD_RUN_COMPLETION_VERSION`: whether a run
     * it executes resumes its parent's child-run completion hook when it
     * finishes. A cross-deployment `start()` from a workflow stamps the child to
     * resume that hook only when the target advertises it. Omitted when the
     * responding deployment predates the hook, so its parents poll instead.
     */
    childRunCompletionVersion?: number;
    /**
     * The format the responding deployment answered in, set whenever it
     * answered: `'text'` for the plain-text reply of deployments that predate
     * the versioned JSON response (spec 3), `'json'` otherwise. A JSON reply
     * proves the responder runs spec 3 or later even when its `specVersion`
     * field is missing or malformed.
     */
    format?: 'json' | 'text';
    /**
     * Version of dynamic-workflow execution supported by the target runtime.
     * Present only when the target has opted in to dynamic workflows.
     */
    dynamicWorkflowVersion?: number;
    /**
     * The responding deployment's `World.capabilities`, so a cross-deployment
     * `start()` can check that the World which will execute the run supports a
     * feature before relying on it (`start({ experimental_hook })` checks
     * `atomicStartHook`). Parsed tolerantly: an unknown capability is dropped
     * and a malformed one reads as unsupported, so a peer on a different SDK
     * version can only ever lose a feature, never its health. Omitted when the
     * responder predates the field or declares none.
     */
    capabilities?: WorldCapabilities;
}
/**
 * Checks if the given message is a health check payload.
 * If so, returns the parsed payload. Otherwise returns undefined.
 */
export declare function parseHealthCheckPayload(message: unknown): HealthCheckPayload | undefined;
/**
 * Handles a health check message by writing the result to the world's stream.
 * The caller can listen to this stream to get the health check response.
 *
 * @param healthCheck - The parsed health check payload
 */
export declare function handleHealthCheckMessage(healthCheck: HealthCheckPayload, worldSpecVersion?: number): Promise<void>;
export interface HealthCheckOptions {
    /** Timeout in milliseconds to wait for health check response. Default: 30000 (30s) */
    timeout?: number;
    /** Deployment ID to send the health check to. Falls back to process.env.VERCEL_DEPLOYMENT_ID. */
    deploymentId?: string;
    /**
     * The run id the caller is about to create. When set, the responding
     * deployment derives that run's public key locally and returns it as
     * `encryptionPublicKey`, letting a cross-deployment `start()` seal the
     * workflow arguments without a separate key lookup.
     */
    runId?: string;
    /**
     * Queue namespace of the target deployment (e.g. `'eve'` for topics like
     * `__eve_wkf_workflow_*`). Falls back to `WORKFLOW_QUEUE_NAMESPACE` in the
     * calling process. Cross-context callers (e.g. the observability
     * dashboard) must pass the target deployment's namespace explicitly:
     * the env fallback resolves in the caller's process, and a message
     * published to a mismatched topic has no consumer, so the check would
     * always time out.
     */
    namespace?: string;
}
export declare function healthCheck(world: World, options?: HealthCheckOptions): Promise<HealthCheckResult>;
/**
 * Appends events whose IDs are not already present in `target`.
 *
 * Pass the IDs currently present in `target` when appending repeatedly to the
 * same array. The set is updated alongside `target`.
 *
 * Events are appended in the order the World returned them, and are not
 * re-sorted. Every append source is already in canonical order relative to the
 * tail (a cursor-delimited page, or a write-response delta), so receipt order is
 * the order to keep, and re-sorting here would only cost a pass over the log.
 * Nothing downstream may assume the tail is the newest event. See
 * {@link maxEventSlot}.
 */
export declare function appendUniqueEvents(target: Event[], events: readonly Event[], targetIds?: Set<string>): void;
/**
 * Inserts `event` into `target` at the position that keeps `target` ordered by
 * ascending `eventId`, or no-ops if an event with the same `eventId` is already
 * present (idempotent).
 *
 * `preloadedEvents` is loaded `sortOrder: 'asc'` and is never re-sorted
 * client-side, so a `hook_received` spliced in by the lazy-resume consumer must
 * land in `eventId` order: a plain `push` would place a late-committing
 * earlier event after events that sort before it, corrupting replay.
 *
 * Lexicographic string order is the log's order: a slot id is a fixed-width
 * zero-padded position, so comparing the strings compares the positions. This
 * needs no parse of its own for that reason, and the comparison is exact rather
 * than a reconstruction.
 */
export declare function insertEventByEventId(target: Event[], event: Event): void;
/**
 * How replay reads the event log. Replay recomputes every step's arguments by
 * re-running workflow code and never reads the recorded ones (a step reads its
 * input from the step entity), so replay reads let the World leave them out.
 * For a workflow passing growing state into its steps, they are the part of
 * the log that grows quadratically.
 */
export declare const REPLAY_RESOLVE_DATA: "skip-step-inputs";
/**
 * Params for a write whose inline delta (`sinceCursor`) is folded into a
 * replay log: that delta is read the way replay reads the log. The created
 * event and `step` entity are unaffected, so a write that asks for no delta
 * is left exactly as it was.
 */
export declare function withReplayDelta(params: CreateEventParams | undefined): CreateEventParams | undefined;
/**
 * Loads workflow run events by iterating through all pages of paginated
 * results. Events are returned in chronological (ascending) order for
 * deterministic workflow replay.
 *
 * @param runId - The workflow run ID.
 * @param afterCursor - If provided, only events after this cursor are
 *   returned (incremental load). If omitted, all events are returned.
 *   The returned cursor can be passed back in on a subsequent call for
 *   incremental loading.
 * @param options.signal - Abandons the load: handed to every page read, and
 *   checked between pages.
 * @param options.specVersion - The run's spec version, handed to every page
 *   read as `ListEventsParams.specVersion`. The spec 9 orchestrator passes it
 *   so the World reads from where the fence `snapshot` is reported.
 */
export declare function loadWorkflowRunEvents(runId: string, afterCursor?: string, options?: {
    signal?: AbortSignal;
    specVersion?: number;
}): Promise<LoadedEventLog>;
/**
 * The runtime's loaded event-log snapshot: the events replayed so far and the
 * cursor positioned after them. Handed to helpers that derive the precondition
 * snapshot from it; they do not mutate it.
 */
export interface LoadedEventLog {
    events: Event[];
    cursor: string | null;
    /**
     * The fence snapshot from the first page of a full load, when the World
     * returned one. Absent on incremental loads.
     */
    snapshot?: EventLogSnapshot;
}
/**
 * Extend a loaded log with a page that continues it — a listed page, or the
 * inline delta a write handed back — and move its read position with it.
 *
 * The cursor is only advanced when the page carries one, so a source with no
 * position of its own (a skipped-slot report) cannot walk the read position
 * past events it did not carry. Appending does not re-sort; see
 * {@link appendUniqueEvents} for why receipt order is the order to keep.
 */
export declare function appendEventLog(log: LoadedEventLog, appended: {
    events: readonly Event[];
    cursor?: string | null;
}): void;
/**
 * Whether a replay refuses to run over a log with a hole in it (see
 * {@link findEventSlotGap}). **On by default**; set
 * `WORKFLOW_SLOT_GAP_CHECK=0` to replay across holes instead.
 *
 * A World that allocates a position at the moment it commits leaves no hole
 * behind when a write fails, so density is a property the log has by
 * construction rather than one this check maintains. What the check is for is
 * the reads and the Worlds where that does not hold, and by the time it runs
 * the benign explanations are spent: a position missing because a concurrent
 * commit is not visible yet clears on a re-read, which is what
 * {@link settleEventSlotGap} does first.
 *
 * What is left is a hole that persists, and its two causes are
 * indistinguishable from the log. Either a World allocated the position outside
 * the commit and lost the write, in which case nothing happened there and
 * replaying past it is correct, or an event that did happen is missing, in
 * which case replaying past it decides a branch on absence and produces a wrong
 * result with nothing to show for it. Failing is the recoverable side of that
 * trade, and this is the way back out if a fleet turns out to carry holes of
 * the first kind.
 */
export declare function isSlotGapCheckEnabled(): boolean;
/**
 * Merge the events a bump-and-report write handed back into the log it was
 * derived from, and answer how many of them were new.
 *
 * Unlike {@link appendUniqueEvents}, this re-sorts. The reported events occupy
 * slots *below* the write that reported them, so appending them would put them
 * after events they precede. Sorting by id restores the World's canonical order
 * rather than guessing at it: a slot id is that order, written down.
 */
export declare function mergeReportedEvents(target: Event[], events: readonly Event[]): number;
/** What {@link absorbSkippedSlotReport} did with a write's report. */
export interface SkippedSlotReport {
    /** How many of the reported events were new to the log. Zero if dropped. */
    added: number;
    /** How many events the report offered, whether or not they were taken. */
    offered: number;
    /** The report was truncated, so it was dropped whole instead of merged. */
    truncated: boolean;
}
/**
 * Apply a write's skipped-slot report to the log it was derived from, deciding
 * whether the report may be taken at all.
 *
 * Every replay-context write can come back carrying the events on the slots it
 * skipped over, and every caller wants the same thing from them: fold them in
 * so the writes that follow name a position above them, and so the replay
 * resuming from this log sees them without a reload.
 *
 * The one policy is that a **truncated report is dropped whole**. It covers a
 * span of positions but carries only some of the events on them, so merging it
 * would raise the log's highest position past a position whose event is
 * missing. Later writes read that maximum to say what they have seen, so each
 * would claim a position it never saw, and the World only reports the span a
 * write skips: it would never send the missing one. Dropping costs one more
 * round of the same events on the next write and keeps the log a prefix of the
 * truth, which the note above {@link mergeReportedEvents} explains is always an
 * available answer.
 *
 * Callers that log do so from the returned counts; the decision is not theirs
 * to re-derive.
 */
export declare function absorbSkippedSlotReport(target: Event[], result: {
    events?: readonly Event[];
    hasMore?: boolean;
}): SkippedSlotReport;
/**
 * The highest slot the loaded log occupies, or `undefined` for an empty log.
 *
 * The maximum, not the count, and the two are not interchangeable even though
 * a healthy log makes them equal. A World hands a position to the insert that
 * occupies it, so a write that never lands leaves no hole behind and the log
 * stays dense. What the count cannot survive is a *partial* read: a log
 * assembled from a truncated report, or read while a concurrent write is
 * committing, holds fewer events than its highest position. Counting those
 * would make the next write claim to have seen less than it has, so the World
 * would report the same events back to it on every attempt.
 *
 * A hole below the maximum is therefore a property of the read, not of the log,
 * which is what lets {@link settleEventSlotGap} re-read instead of giving up.
 *
 * @throws if any event id carries no slot. Every World the runtime replays
 * against numbers events by slot, so an id that does not is a broken log rather
 * than an older one, and a maximum derived by skipping it would understate the
 * log to every write that reads it.
 */
export declare function maxEventSlot(events: readonly Event[]): number | undefined;
/** A position the log skips over, described well enough to name in an error. */
export interface EventSlotGap {
    /** The lowest slot below the log's maximum that no event occupies. */
    firstMissingSlot: number;
    /** How many slots below the maximum no event occupies. */
    missingCount: number;
    /** The highest slot the log occupies. */
    maxSlot: number;
}
/**
 * The hole in a loaded log, or `undefined` when there is none to find.
 *
 * The World allocates every position, so a log that holds `n` events below slot
 * `n` is missing one. That matters before a replay
 * and nowhere else: the replay reads the log as the complete record of what has
 * happened, and an absent position is indistinguishable from an event that
 * never occurred. The branch it would have decided gets decided the other way,
 * and the run diverges quietly rather than failing.
 *
 * Order-independent, unlike the equivalent audit the World runs over a page it
 * just read. A loaded log is assembled from listed pages plus whatever a
 * bump-and-report write handed back, and while {@link mergeReportedEvents}
 * restores id order, a check that can fail a healthy run should not depend on
 * that having happened.
 *
 * The first slot is never counted. It belongs to `run_created`, which `start()`
 * posts concurrently with the queue send, so a log read in that window
 * legitimately begins at the second slot and fills in on its own. Every replay
 * that races a run's own start would otherwise report a hole.
 *
 * Returns `undefined` for an empty log, which has no density to check.
 *
 * @throws if any event id carries no slot, for the reason {@link maxEventSlot}
 * gives.
 */
export declare function findEventSlotGap(events: readonly Event[]): EventSlotGap | undefined;
/**
 * How many times a detected hole is re-read before the log is taken at its
 * word, and the backoff before each re-read (doubling per attempt).
 *
 * A hole can be transient. The World allocates a slot inside the insert that
 * occupies it, so two concurrent writers can collide, one retry past the other,
 * and the higher slot commit first, leaving a window in which the lower one is
 * genuinely absent from a strongly-consistent read and fills in a moment later.
 * The window is one commit wide, so a short backoff clears it; anything that
 * survives all three re-reads is a position no write will ever occupy.
 */
export declare const SLOT_GAP_RECHECK_ATTEMPTS = 3;
export declare const SLOT_GAP_RECHECK_BASE_DELAY_MS = 25;
/**
 * Re-read a log that looks holey until the hole fills in or the re-reads run
 * out, and return the settled log alongside the hole that survived.
 *
 * Reads are strongly consistent, so a hole is not an artifact of *when* the log
 * was read, but it can be an artifact of a write that had not committed yet
 * (see {@link SLOT_GAP_RECHECK_ATTEMPTS}). Distinguishing the two costs a
 * re-read, which is only ever paid by a replay that already found a hole.
 *
 * The reload is full rather than incremental: the missing position is below the
 * log's maximum, so a cursor-anchored read starts past it and can never see it
 * arrive. Each re-read keeps every event the caller already held: the
 * orchestrator's log holds its own writes from their responses, and with
 * run-ahead an outcome the workflow consumed before its write committed. A
 * re-read can come back without one of those, and replacing the log with it
 * would leave a position this delivery already took in nobody's view.
 */
export declare function settleEventSlotGap(runId: string, loaded: LoadedEventLog, options?: {
    specVersion?: number;
}): Promise<{
    log: LoadedEventLog;
    gap: EventSlotGap | undefined;
}>;
/**
 * How much of its run's log a replay-context event creation had loaded when it
 * decided to write, as the highest slot that log occupies.
 *
 * One integer says it because the World keeps its positions dense: a writer
 * that names slot N is claiming to hold every event from 1 to N and nothing
 * above. The World answers by numbering the write above whatever the log has
 * actually reached and handing back the events on the slots in between: the
 * ones this writer decided without.
 *
 * Density is the World's invariant, not a claim about this particular read. A
 * reader that is short of a position it holds no event for names a lower N,
 * which understates what it has seen and only costs it a wider report. Naming
 * a position it cannot account for is the direction that is unsafe, which is
 * why {@link slotSnapshotParams} takes the maximum rather than the count.
 *
 * Its own object rather than a bare number so a call site cannot half-send it,
 * and so the empty case spreads to nothing.
 */
export interface SlotSnapshotParams {
    eventCount?: number;
}
/**
 * Build the slot snapshot to attach to a replay-context event creation.
 *
 * Empty for an empty log, which is the state a `run_created` write is issued
 * from: there is no position held yet to name.
 *
 * ## Who names a position
 *
 * A World can hand events back on a write's success response through two
 * params (`CreateEventParams` in `@workflow/world`): `eventCount`, which is
 * answered with the events on the positions the write skipped over (the
 * skipped-slot report), and `sinceCursor`, which is answered with everything
 * after that cursor (the inline delta). Both exist to save the writer a
 * reload. So the rule for which writes send them is not about the event type;
 * it is about whether **the process that writes holds a loaded log it will
 * keep deciding from**, its own next writes or the replay it resumes. A writer
 * with no log has nothing to merge a page into, and whoever decides next is a
 * fresh replay that loads the log anyway.
 *
 * Three gates, all of which must pass for a page to come back:
 *
 * 1. The writer names a position. Only the replay loop's `createEvent` seam
 *    (runtime.ts) and the suspension handler's `createGuarded` do; the QuickJS
 *    engine's `createEvent` (quickjs-entrypoint.ts) follows the same rule. Raw
 *    `world.events.create` calls send nothing.
 * 2. The World reads a page for that event type. A World may decline for types
 *    whose writer never holds a log (step executor writes, run-terminal
 *    writes), whatever the client sent.
 * 3. There is something to hand back: the report only when the write landed
 *    more than one position above `eventCount`; the delta always.
 *
 * | Event | Writer | Sends | Why |
 * |---|---|---|---|
 * | `run_created` | `start()` | nothing | no log exists yet |
 * | `run_started` | replay loop, first write of a delivery | `eventCount` when a log is loaded; no cursor, the `run_started` preload owns the response fields | the preload already returns the full log |
 * | `step_created`, `wait_created`, `hook_disposed`, `attr_set` | suspension handler (`createGuarded`) | `eventCount` | the handler keeps writing from, and resumes replay from, this log |
 * | `step_created` | queue-consumer re-ensure (raw) | nothing | runs from a queue message, no log |
 * | `hook_created` | suspension handler (node), `dispatchPendingOps` (QuickJS) | `eventCount` + `sinceCursor` (only when the suspension creates exactly one hook); independent concurrent node registrations in a hooks-only suspension defer both | a lone create returns a delta; concurrent registrations reconcile committed responses together, reloading when they do not prove a consecutive suffix |
 * | `hook_received` | replay loop lazy resume; handler in-suspension resume | `eventCount` (preload owns the cursor fields) | both replay from the log right after |
 * | `hook_received` | webhook / `resumeHook` (raw) | nothing | out-of-band, enqueues a delivery that loads the log |
 * | `wait_completed` | replay loop timer path | `eventCount` | the loop keeps replaying from the log |
 * | `wait_completed` | `runs.*` out-of-band (raw) | nothing | no log |
 * | `step_started`, `step_retrying` | step executor | nothing | no log; the next decision is a replay that reloads or receives the delta below |
 * | `step_completed`, `step_failed` | step executor | `sinceCursor` only, outside turbo, single inline step | this is where the inline execution loop gets its log back; in turbo or from a queued delivery a fresh replay loads it anyway |
 * | `step_failed` | suspension handler, unserializable input | `eventCount` | the handler holds a log; rare, and follows a `step_created` that drew the page |
 * | `attr_set` | `setAttributes()` API (raw) | nothing | out-of-band |
 * | `run_completed`, `run_failed`, `run_cancelled` | replay loop, replay budget, `runs.cancel` | `eventCount` where the node loop's seam stamps it (the QuickJS engine sends nothing); never `sinceCursor` (`deltaRequestCursor` excludes terminal types) | terminal: nothing replays the log afterwards, so a World reads no page for them |
 *
 * Batched writes (`events.createBatch`) are outside all of this: a batch carries
 * no per-event position and gets no page. The user-facing version of this table
 * is in `docs/content/docs/v5/how-it-works/event-sourcing.mdx`; keep the two in
 * step.
 *
 * The maximum rather than the length, for the reason {@link maxEventSlot}
 * gives: a partially-read log holds fewer events than its highest position, and
 * counting those would make the write claim to have seen less than it has, so
 * the World would report the same events back on every attempt.
 */
export declare function slotSnapshotParams(events: readonly Event[]): SlotSnapshotParams;
/**
 * The events a rejecting World attached to a `PreconditionFailedError`, when it
 * returned the ones the client's snapshot was missing inline.
 *
 * Returns `null` for anything else: no details, a World that did not implement
 * this, or a payload that does not narrow cleanly. Callers fall back to
 * reloading the event log, which is always correct; this is untrusted-shaped
 * data on a failure path, so nothing here is repaired.
 *
 * `runId` is the caller's run. Every event must belong to it: the delta is
 * merged straight into the replay's log, and one foreign event there is a
 * corrupt log rather than a corrected one: the replay would consume a
 * correlation id for an event that does not exist on this run.
 */
export declare function preconditionEventDelta(error: unknown, runId: string): {
    events: Event[];
    cursor: string | null;
} | null;
/** Creates one event on a bound run, carrying replay-recovery telemetry. */
export type EventCreator = (data: CreateEventRequest, params?: CreateEventParams) => Promise<EventResult>;
/**
 * Wraps a request/response handler and adds a health check "mode"
 * based on the presence of a `__health` query parameter.
 */
export declare function withHealthCheck(handler: (req: Request) => Promise<Response>, worldSpecVersion?: number): (req: Request) => Promise<Response>;
/**
 * The lineage root of a loaded run: its `$rootRunId` attribute, or its own id
 * when it is itself a root.
 */
export declare function rootRunIdFrom(attributes: Record<string, string> | undefined, runId: string): string;
/**
 * The immutable run identity a step-execution message carries so its consumer
 * can start the step without a blocking `runs.get` — see
 * `RunDispatchContextSchema` in @workflow/world. Built at dispatch time from
 * the run row the producer already holds.
 */
export declare function runDispatchContext(run: Pick<WorkflowRun, 'runId' | 'deploymentId' | 'specVersion' | 'startedAt' | 'attributes'>): RunDispatchContext;
/**
 * Idempotency key for a step's background-dispatch queue message, scoped to
 * the step's IDENTITY, correlation id plus (hashed) step name, rather than
 * the bare correlation id.
 *
 * The scoping matters when a step message is still in flight for a
 * correlation id that a corrected replay re-derives for a DIFFERENT step.
 * Under a bare-correlationId key the corrected replay's dispatch would
 * silently dedupe against the stale in-flight message,
 * which then resolves `skipped` against the re-created entity (the server's
 * stepName fence rejects its bare start), and the legitimate step would
 * never be executed. Scoping by step name keeps every dedup property that
 * matters (crash recovery re-dispatch, concurrent handlers, the delayed
 * retry sharing the suspension re-dispatch's key: all name the same step)
 * while letting the corrected schedule's dispatch through.
 *
 * Every producer of a step-dispatch (or step-retry) message must use this
 * key. Cross-version mixing is not a concern: queue messages are pinned to
 * the deployment that produced them, so one run never sees two key schemes.
 */
export declare function stepDispatchIdempotencyKey(correlationId: string, stepName: string): string;
/**
 * Whether `err` came from a failed queue publish ({@link queueMessage} or
 * {@link queueMessages}). Queue errors are not `WorkflowWorldError`s, so the
 * orchestrator would otherwise read them as a failure of the run. A failed
 * publish fails the delivery instead: the queue redelivers it, and the
 * redelivery publishes again.
 */
export declare function isQueueSendFailure(err: unknown): boolean;
/**
 * Queues a message to the specified queue with tracing.
 */
export declare function queueMessage(world: World, ...args: Parameters<typeof world.queue>): Promise<void>;
/**
 * Publishes several messages to one logical queue, using the World's batch
 * send when it has one and falling back to concurrent single sends when it
 * does not.
 *
 * Rejects if ANY message failed to publish, because every caller so far wants
 * all-or-nothing: the recovery is to fail the delivery and let redelivery
 * republish the whole set, deduped by the per-message `idempotencyKey`. That
 * means a partial batch can leave some messages already out — which is
 * exactly why the keys are required rather than advisory.
 */
export declare function queueMessages(world: World, queueName: Parameters<typeof world.queue>[0], messages: readonly {
    message: Parameters<typeof world.queue>[1];
    opts?: Parameters<typeof world.queue>[2];
}[]): Promise<void>;
/**
 * Calculates the queue overhead time in milliseconds for a given message.
 */
export declare function getQueueOverhead(message: {
    requestedAt?: Date;
}): {
    [k: string]: number;
} | undefined;
/**
 * Resolve the run's full payload-encryption capability. This includes the
 * symmetric key and X25519 keypair needed to open cross-run sealed payloads.
 * Missing world support or key material resolves to `undefined`; lookup and
 * derivation failures propagate rather than silently falling back to plaintext.
 */
export declare function resolveRunEncryptionKey(world: World, runOrId: WorkflowRun | string, context?: Record<string, unknown>): Promise<PayloadKey | undefined>;
/**
 * Return a lazy, memoized accessor around {@link resolveRunEncryptionKey}.
 * Concurrent callers share the same promise, including its rejection.
 */
export declare function memoizeEncryptionKey(world: World, runOrId: WorkflowRun | string): () => Promise<PayloadKey | undefined>;
//# sourceMappingURL=helpers.d.ts.map