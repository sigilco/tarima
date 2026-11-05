import type { BatchEventRequest, CreateEventBatchParams, CreateEventParams, CreateEventRequest, Event, EventBatchResult, EventLogSnapshot, EventResult, World } from '#compiled/@workflow/world/index.js';
/**
 * Thrown by an {@link InBandWriter} once the World has refused one of its
 * writes as superseded, for that write and for every write after it. The
 * orchestrator delivery that sees it stops writing and stops starting inline
 * step bodies, sends the queue messages its own committed writes still owe
 * (see {@link InBandWriter.onAccepted}), and asks for a redelivery of its own
 * message (`{ timeoutSeconds: 1 }`) instead of acknowledging it. The
 * redelivery is counted as an attempt.
 *
 * The refusal does not say that another writer is running. The World
 * refuses a write whose expected count is stale, which happens when another
 * orchestrator wrote in-band, when the World sealed this writer's own
 * position because its write outlived the World's staleness bound, or when
 * an earlier write of this writer was refused after the World had allocated
 * its position. The redelivery covers the cases with no other writer, and
 * re-sends whatever a delivery that died left unsent.
 */
export declare class OrchestratorSupersededError extends Error {
    readonly cause: unknown;
    constructor(cause: unknown);
    static is(value: unknown): value is OrchestratorSupersededError;
}
/**
 * The fence snapshot a full log load hands the {@link InBandWriter}.
 *
 * Every page of a single-orchestrator run's log carries one
 * (`EventListResponse.snapshot`). The one case without it is a resilient
 * start: `run_created` never landed, so there is no run and the load is empty.
 * The delivery's first in-band write, `run_started` carrying the creation
 * data, follows the creation the World performs for it, which holds the run's
 * first in-band position, so the count is 1.
 *
 * A non-empty log without a snapshot means the World broke the contract, and
 * this throws a World contract error, which fails the run instead of writing
 * without the fence.
 */
export declare function requireLoadSnapshot(runId: string, loaded: {
    events: readonly unknown[];
    snapshot?: EventLogSnapshot;
}): EventLogSnapshot;
/** {@link requireLoadSnapshot}'s answer for a run that does not exist yet. */
export declare const RESILIENT_START_SNAPSHOT: EventLogSnapshot;
/**
 * Writes the orchestrator's in-band events and keeps its count of in-band
 * positions.
 *
 * - The count starts from the first page's `snapshot.seqInBand` of the
 *   delivery's full log load ({@link adoptSnapshot}), never from counting
 *   events: a count cannot say which positions were in-band.
 * - It advances by the number of positions each accepted write allocated,
 *   as the World reports it (`allocated`). A World that does not report it
 *   is assumed to allocate 1 per create and the whole block per batch,
 *   except for an event answered at a slot this writer already knew: that
 *   is an idempotent replay, which allocated nothing.
 * - Writes are serialized. Two concurrent in-band writes would both carry the
 *   same expected count and the second would be refused, so a fan-out goes
 *   through {@link createBatch} or waits its turn.
 * - Run-ahead writes ({@link createAhead}, {@link createBatchAhead}) that queue
 *   up behind a write in flight coalesce: when their turn comes they go out
 *   together as one batch, in the order they were made, with one fence check,
 *   so a pipeline of speculative steps costs one round trip per turn rather
 *   than one per write. Any other write closes the group, so it never
 *   reorders writes. Each write's result is its slice of the batch, checked
 *   in order; a refusal or a failed check stops the writer for every write
 *   behind it, as it does for a required write. A batch on a spec >= 9 run is
 *   not atomic, but every World orders it per entity (see `Storage.events`):
 *   it refuses a step's outcome behind its refused creation itself, so a
 *   group may carry several writes for one step. A group stays within
 *   {@link MAX_BATCH_EVENTS} events and, counted as a creation batch is,
 *   {@link MAX_IN_BAND_CREATION_BATCH_BYTES} bytes: a World refuses an
 *   oversized batch whole.
 * - The first refusal stops the writer for good: every later write throws
 *   {@link OrchestratorSupersededError} without reaching the World. The value
 *   the error carries is never adopted.
 * - A write that fails without a definite answer (a transport error, a 5xx)
 *   may or may not have allocated positions, so the count is no longer
 *   known. The writer stops in the same way and the error propagates, so the
 *   delivery is retried and loads the log afresh. A definite refusal (any
 *   other 4xx) leaves the count as it was.
 * - In-band writes on a spec >= 9 run all go through one writer per delivery.
 *   A write made outside it would move the World's count without this one
 *   knowing, and the next write here would be refused.
 *
 * The runtime drives a spec 9 run only on a World that implements the fence
 * (`WorldCapabilities.inBandFence`), so the writer always sends an expected
 * count. A write before any snapshot was
 * adopted is a runtime bug, and fails without reaching the World.
 */
export declare class InBandWriter {
    private readonly world;
    private readonly runId;
    private expected;
    /**
     * Highest slot this writer knows is allocated: the load snapshot's `seq`,
     * raised by the slots of its own accepted writes. Used to tell a write
     * that allocated nothing (an idempotent replay answered with the existing
     * event) from one that allocated, and as the fallback `eventCount`.
     */
    private knownMaxSlot;
    /** `snapshot.seq` of the last full load: an understated position. */
    private loadedSlot;
    /**
     * Every event at or below this slot has reached this writer: through a
     * full load, or the complete skipped-slot report of an accepted write
     * (see {@link sendPosition}).
     */
    private completeThrough;
    private stoppedBy;
    private stopped;
    /**
     * Set by {@link stopDecisions}: the error every write it does not allow
     * fails with, and the test of what it still allows.
     */
    private decisionsStop;
    /**
     * Run-ahead writes waiting for their turn, sent together as one batch when
     * it comes. Closed (unset) once the turn starts or another write queues.
     */
    private openGroup;
    private tail;
    /**
     * Called with every event a write of this writer committed, in commit
     * order, before the write's own checks run: a run-ahead write that fails
     * its check, or a batch whose later items were refused, still committed
     * these. The delivery keeps from them what it owes the queue (a
     * background step's message, a wait's timer) until it sends it.
     */
    onAccepted: ((event: Event) => void) | undefined;
    /** Throws for a World that does not declare the fence. */
    constructor(world: Pick<World, 'events' | 'capabilities'>, runId: string);
    private accepted;
    /**
     * Take the snapshot of a full load (see {@link requireLoadSnapshot}). Later
     * full loads replace it.
     */
    adoptSnapshot(snapshot: EventLogSnapshot): void;
    /** Whether a snapshot was adopted, so the writer has a count to send. */
    get hasSnapshot(): boolean;
    /** Whether a refusal or an unknown allocation stopped this writer. */
    get isStopped(): boolean;
    /**
     * Stops the writer for every write `mayStillWrite` does not allow, and keeps
     * sending the ones it does, in order. Used when the run's path may have
     * changed under decisions this delivery made ahead of their writes: those
     * decisions must not reach the World, while the outcome of a step whose
     * body already ran is a fact about that body and still can. Every refused
     * write, and {@link assertActive}, throws `error`. A later {@link halt} or
     * failed write still stops the writer for good.
     */
    stopDecisions(error: unknown, mayStillWrite: (events: readonly CreateEventRequest[]) => boolean): void;
    /** Throws when the writer may not send these events. */
    private assertMayWrite;
    /** Whether the stop came from a fence refusal. */
    get isSuperseded(): boolean;
    /** Whether the World can take a batch write. */
    get supportsBatch(): boolean;
    /** The current expected count, for diagnostics and tests. */
    get expectedSeqInBand(): number | undefined;
    /**
     * Throws when the writer has stopped; call before starting an inline body.
     * See the comment inside for which error.
     */
    assertActive(): void;
    create<T extends CreateEventRequest>(data: T, params?: CreateEventParams): Promise<EventResult<T['eventType']>>;
    /**
     * A write every later write of this delivery depends on: turbo mode's
     * backgrounded `run_started`. Writes queue behind it like any other, but
     * any failure stops the writer, a definite refusal included, so nothing
     * this delivery writes afterwards reaches the World, and
     * {@link assertActive} refuses to start further inline bodies. The later
     * writes and {@link assertActive} throw this write's error.
     */
    createRequired<T extends CreateEventRequest>(data: T, params?: CreateEventParams, 
    /**
     * Checks the accepted write before any later write is sent. A throw
     * stops the writer with the thrown error, as a failed write would. Used
     * by run-ahead to confirm that a speculative write landed where the
     * workflow already consumed it.
     */
    verify?: (result: EventResult<T['eventType']>) => void): Promise<EventResult<T['eventType']>>;
    /**
     * The slot the next write would take if no other writer appends first:
     * one past every position this writer knows is allocated, including the
     * writes still queued in it. Run-ahead places a speculative event there.
     */
    predictNextSlot(): number;
    /** A position another writer took, seen in a load, a report or the feed. */
    observeSlot(slot: number): void;
    /**
     * Stops the writer for good with `error`, as a failed write would: every
     * later write and {@link assertActive} throw it.
     */
    halt(error: unknown): void;
    /** The error that stopped the writer, if it stopped. */
    get stopCause(): unknown;
    /**
     * Runs `read` in the writer's queue: after every write queued before it has
     * settled (its position counted or refused), and before any write queued
     * after it is sent. A full load reads the run's in-band count and adopts it
     * ({@link adoptSnapshot}) inside one, so no write commits between the read
     * and the adoption and is then counted twice, or not at all. Waiting for
     * {@link idle} first is not enough: a write queued while the read is in
     * flight would be sent beside it.
     */
    exclusive<T>(read: () => Promise<T>): Promise<T>;
    /** Resolves once every write queued so far has settled. */
    idle(): Promise<void>;
    private write;
    private sendSingle;
    createBatch(events: BatchEventRequest[], params?: Omit<CreateEventBatchParams, 'inBand' | 'expectedSeqInBand'>): Promise<EventBatchResult>;
    /**
     * {@link createBatch} as a required write (see {@link createRequired}):
     * any failure stops the writer, and `verify` checks the result before any
     * later write is sent.
     */
    createBatchRequired(events: BatchEventRequest[], params: Omit<CreateEventBatchParams, 'inBand' | 'expectedSeqInBand'>, verify: (result: EventBatchResult) => void): Promise<EventBatchResult>;
    /**
     * A run-ahead write: a required write (see {@link createRequired}) that may
     * coalesce with the run-ahead writes queued next to it. `verify` checks the
     * accepted write before any later write is sent.
     */
    createAhead(data: CreateEventRequest, params: CreateEventParams, verify: (result: EventResult) => void): Promise<EventResult>;
    /**
     * A run-ahead batch: {@link createBatchRequired} that may coalesce with the
     * run-ahead writes queued next to it.
     */
    createBatchAhead(events: BatchEventRequest[], params: Omit<CreateEventBatchParams, 'inBand' | 'expectedSeqInBand'>, verify: (result: EventBatchResult) => void): Promise<EventBatchResult>;
    private enqueueAhead;
    /** Sends a group of run-ahead writes as one batch and splits the result. */
    private sendGroup;
    /**
     * A lone run-ahead batch of one event goes out as a single write. A
     * definite refusal reaches `verify` as the batch's refused item, the way a
     * batch reports it.
     */
    private sendBatchOfOne;
    private writeBatch;
    private fenceParams;
    private advance;
    /**
     * Positions a single accepted write allocated. The World's response does
     * not state it, so it is inferred: an event at a slot this writer already
     * knew to be allocated when it sent the write is an idempotent replay of
     * an earlier write (for example a deduplicated `hook_received`), which
     * allocated nothing. Slots learned while the write was in flight do not
     * count: the live feed can deliver the write's own events, and later
     * ones, before its response.
     */
    private allocatedBy;
    private noteSlot;
    /**
     * The position an in-band write names when it is sent: the one it was
     * decided from (a caller that names none gets the last full load's
     * `snapshot.seq`), raised to {@link completeThrough}. A write queued behind
     * others was decided from a position below theirs, and naming it would
     * have the World report back every event those writes made, which this
     * writer already has from their responses. Naming more than the decision
     * saw is safe because everything up to `completeThrough` has reached this
     * writer: a load, or a response whose report was complete.
     */
    private sendPosition;
    /**
     * Raises {@link completeThrough} past an accepted write whose response
     * reported everything below it: the write named a position, and its
     * skipped-slot report is neither incomplete nor truncated.
     */
    private noteComplete;
    private stop;
    /** Positions of the writes queued in this writer and not yet settled. */
    private pendingPositions;
    private serialize;
}
export declare function withWrittenEventData<E extends Event>(event: E, request: CreateEventRequest, fresh: boolean): E;
//# sourceMappingURL=in-band-writer.d.ts.map