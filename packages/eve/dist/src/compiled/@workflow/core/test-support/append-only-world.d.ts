import { type CreateEventParams, type Event, type ListEventsParams, type WorkflowRun, type World } from '#compiled/@workflow/world/index.js';
/**
 * The limits world-vercel puts on one `createBatch` call, the World this fake
 * models: at most 100 events, and at most 768 KiB of frame meta and payloads.
 * They are the World's, held here apart from the runtime's own batch budget
 * (`MAX_IN_BAND_CREATION_BATCH_*` in `runtime/constants.ts`), so a change to
 * that budget, or to how the runtime counts a batch's bytes, cannot raise
 * what this fake accepts along with it.
 */
export declare const WORLD_EVENT_BATCH_LIMITS: Readonly<{
    maxEvents: 100;
    maxBytes: number;
}>;
/**
 * The bytes one batch item takes on the wire, as this fake counts them,
 * independently of the runtime's estimate: its JSON with every binary
 * payload left out, plus each payload's length.
 */
export declare function eventBatchItemBytes(event: unknown): number;
/** One `world.queue` call recorded by {@link AppendOnlyWorld}. */
export interface RecordedQueueCall {
    queueName: string;
    message: unknown;
    opts?: Record<string, unknown>;
}
/** A queue message the World holds until a test delivers it. */
export interface HeldMessage {
    message: unknown;
    messageId: string;
    queueName: string;
    deliveryCount: number;
    createdAt: Date;
    opts?: Record<string, unknown>;
    /** Deliveries of this message that ended in a handoff. */
    handoffCount?: number;
    /**
     * Delivered as the given re-run of a coalesced delivery: the next
     * `deliveryCount` by this many, `attempt` unchanged.
     */
    coalescedRerun?: number;
    /** Passed as `meta.invocationStartedAt`. */
    invocationStartedAt?: number;
    /**
     * When the queue's clock makes the message due (epoch ms): its send time
     * plus its delay, or a redelivery's time plus its `timeoutSeconds`. Read by
     * {@link AppendOnlyWorld.runOnClock}.
     */
    dueAtMs?: number;
}
/** One delivery a test made, with what the handler returned. */
export interface RecordedDelivery {
    message: unknown;
    messageId: string;
    deliveryCount: number;
    result: unknown;
}
/** One `events.create` call recorded by {@link AppendOnlyWorld}. */
export interface RecordedCreate {
    event: Event;
    params?: CreateEventParams;
}
/**
 * An in-memory World that keeps no step or wait state: every step and wait
 * event is a plain append, with no exists, terminal, `retryAfter` or
 * `stepName` checks. Run state is checked the way the World contract still
 * asks (writes that start work on a terminal run are refused).
 *
 * It implements the in-band writer fence a World that creates spec 9 runs
 * must: it counts in-band
 * positions, returns `snapshot` from `list`, refuses a stale in-band write
 * with `InBandSupersededError`, and refuses an in-band write without an
 * expected count with a 400. It stores an in-band write at its `occurredAt`,
 * orders a batch per entity, and treats `{ timeoutSeconds: 0 }` as a
 * handoff, as every World does for a single-orchestrator run.
 *
 * It implements the optional parts of the single-orchestrator contract so
 * tests can switch them on and off:
 *
 * - `subscribe`: the live feed.
 * - `reportIncomplete`: answer in-band writes with an incomplete skipped-slot
 *   report (`hasMore: true`).
 *
 * Every created event is recorded, so a test can assert what the runtime
 * wrote and with which params.
 */
export declare class AppendOnlyWorld {
    readonly options: {
        subscribe?: boolean;
        /**
         * How the live feed's `subscribe` fails, as on a World whose push
         * transport is unavailable: `microtask` accepts the subscription and
         * reports an error through `onError` in a microtask; `throw` throws
         * from `subscribe`. Implies `subscribe`.
         */
        subscribeFailure?: 'microtask' | 'throw';
        /** Raw AES-256 key returned for every run, so payloads are encrypted. */
        encryptionKey?: Uint8Array;
        /**
         * Answer creates with a placeholder in place of the payload bytes, as a
         * World that returns payloads as lazy references does. The log keeps
         * the bytes.
         */
        lazyCreatePayloads?: boolean;
        reportIncomplete?: boolean;
        /** Leave `events.createBatch` out, as a World without batch writes. */
        noBatch?: boolean;
        /**
         * Offer `queueBatch`, recorded in {@link AppendOnlyWorld.queueBatches}.
         * Each message is published as a single `queue` call would be. A throw
         * from `failQueueBatch` fails that call whole.
         */
        queueBatch?: boolean;
        /** Called with each `queueBatch` call's messages before it publishes. */
        failQueueBatch?: (messages: readonly {
            message: unknown;
            opts?: unknown;
        }[]) => void | Promise<void>;
        /**
         * Answer every `events.create` and `events.createBatch` this many
         * milliseconds late, after committing, as a remote World's round trip.
         */
        createDelayMs?: number;
        /**
         * Hook tokens another run already holds: a `hook_created` for one of
         * them commits `hook_conflict` instead, as a World with a token index
         * does.
         */
        takenHookTokens?: readonly string[];
        /**
         * Honor `resolveData: 'skip-step-inputs'` on replay pages (list pages
         * and skipped-slot reports): `step_created` and `step_started` are
         * served without `input`. The log and the created event keep it.
         */
        skipStepInputs?: boolean;
        /**
         * Whether a handoff (`{ timeoutSeconds: 0 }`) of `held` continues on a
         * new message instead, as world-vercel does for a message close to its
         * expiry: the held message is acknowledged, and a new one (fresh id,
         * first delivery) is held in its place, with the payload
         * `singleOrchestratorContinuationPayload` builds from the held one.
         */
        rotateHandoff?: (held: HeldMessage) => boolean;
        /**
         * Called with the delay of every `{ timeoutSeconds }` result, so a
         * test with fake timers can let that time pass before the redelivery.
         */
        advanceClock?: (seconds: number) => void;
        /**
         * Coalesce like a VQS concurrency key: a keyed message (an orchestrator
         * message by `orchestratorRunIdOf`, so not a step message and not an
         * intermediate wait hop) enqueued undelayed while one of the run's
         * orchestrator deliveries runs is not held but counted on that
         * delivery, and a delivery that would acknowledge with messages
         * counted runs its handler again until none are, each re-run with the
         * next `deliveryCount` and the same `attempt`, as world-vercel reports
         * one. A delayed message is held; a test that lets one come due while
         * a delivery runs calls {@link AppendOnlyWorld.comeDue}.
         */
        coalesce?: boolean;
        /**
         * In `coalesce` mode, the most re-runs of one delivery; past them the
         * message is handed off (redelivered, not counted as an attempt), as
         * world-vercel does. Unbounded when absent.
         */
        maxCoalescedReruns?: number;
        /**
         * Called before every `events.create`, before anything is checked or
         * written. A test throws from it to refuse a write, or awaits in it to
         * hold one back.
         */
        beforeCreate?: (data: {
            eventType: string;
            eventData?: Record<string, unknown>;
        }, params: CreateEventParams | undefined, 
        /** Whether the event is an item of a `createBatch` call. */
        source?: {
            batch: boolean;
        }) => void | Promise<void>;
        /**
         * Called before every `events.list`, after the call is recorded. A test
         * awaits in it to hold a read back, as a remote World's read that is
         * held in transit.
         */
        beforeList?: (params: ListEventsParams) => void | Promise<void>;
        /**
         * How long the queue deduplicates an idempotency key after the send
         * that made it held a message, in ms of the (possibly faked) system
         * clock, whether that message is still held, being delivered, or was
         * acknowledged. Past it a send under the key is a new message, as on a
         * queue with a finite dedupe window (world-vercel's is 24 hours).
         * Absent: a key is deduplicated for as long as the fake lives.
         */
        keyDedupeWindowMs?: number;
    };
    readonly events: Event[];
    readonly creates: RecordedCreate[];
    readonly queueCalls: RecordedQueueCall[];
    /** Messages enqueued and not yet acknowledged. */
    readonly held: HeldMessage[];
    readonly deliveries: RecordedDelivery[];
    /** The event types of every `createBatch` call, in call order. */
    readonly batches: string[][];
    /**
     * The messages of every `queueBatch` call (with the `queueBatch` option),
     * in call order. Each message is also recorded in {@link queueCalls}.
     */
    readonly queueBatches: RecordedQueueCall[][];
    /**
     * Every in-band write's named position and first slot, in call order: how
     * many positions its skipped-slot report covered.
     */
    readonly reportSpans: {
        eventCount: number;
        firstSlot: number;
    }[];
    /** How many `events.create` and `events.createBatch` calls were made. */
    createCalls: number;
    /** The params of every `events.list` call. */
    readonly listCalls: Array<Record<string, unknown>>;
    /** Replay events served without their step input (`skipStepInputs`). */
    strippedStepInputs: number;
    private handler;
    seq: number;
    seqInBand: number;
    private readonly subscribers;
    private run;
    /** The orchestrator delivery in flight, in `coalesce` mode. */
    private activeOrchestrator;
    /** How many messages were coalesced into a delivery, in `coalesce` mode. */
    coalescedMessages: number;
    /** Deliveries handed off past `maxCoalescedReruns`, in `coalesce` mode. */
    coalescedHandoffs: number;
    /** Handoffs continued on a new message (see `rotateHandoff`). */
    rotations: number;
    /** Messages a test enqueued (see `enqueue`), for their unique ids. */
    private enqueued;
    /** Idempotency keys of the messages being delivered, with their counts. */
    private readonly deliveringKeys;
    /**
     * Idempotency keys of acknowledged messages. A queue keeps a key past the
     * message's acknowledgment (Vercel Queues for `min(retention, 24h)`), so a
     * late send under it is dropped too.
     */
    private readonly acknowledgedKeys;
    /** When each idempotency key was last sent as a new message (epoch ms). */
    private readonly keySentAtMs;
    constructor(options?: {
        subscribe?: boolean;
        /**
         * How the live feed's `subscribe` fails, as on a World whose push
         * transport is unavailable: `microtask` accepts the subscription and
         * reports an error through `onError` in a microtask; `throw` throws
         * from `subscribe`. Implies `subscribe`.
         */
        subscribeFailure?: 'microtask' | 'throw';
        /** Raw AES-256 key returned for every run, so payloads are encrypted. */
        encryptionKey?: Uint8Array;
        /**
         * Answer creates with a placeholder in place of the payload bytes, as a
         * World that returns payloads as lazy references does. The log keeps
         * the bytes.
         */
        lazyCreatePayloads?: boolean;
        reportIncomplete?: boolean;
        /** Leave `events.createBatch` out, as a World without batch writes. */
        noBatch?: boolean;
        /**
         * Offer `queueBatch`, recorded in {@link AppendOnlyWorld.queueBatches}.
         * Each message is published as a single `queue` call would be. A throw
         * from `failQueueBatch` fails that call whole.
         */
        queueBatch?: boolean;
        /** Called with each `queueBatch` call's messages before it publishes. */
        failQueueBatch?: (messages: readonly {
            message: unknown;
            opts?: unknown;
        }[]) => void | Promise<void>;
        /**
         * Answer every `events.create` and `events.createBatch` this many
         * milliseconds late, after committing, as a remote World's round trip.
         */
        createDelayMs?: number;
        /**
         * Hook tokens another run already holds: a `hook_created` for one of
         * them commits `hook_conflict` instead, as a World with a token index
         * does.
         */
        takenHookTokens?: readonly string[];
        /**
         * Honor `resolveData: 'skip-step-inputs'` on replay pages (list pages
         * and skipped-slot reports): `step_created` and `step_started` are
         * served without `input`. The log and the created event keep it.
         */
        skipStepInputs?: boolean;
        /**
         * Whether a handoff (`{ timeoutSeconds: 0 }`) of `held` continues on a
         * new message instead, as world-vercel does for a message close to its
         * expiry: the held message is acknowledged, and a new one (fresh id,
         * first delivery) is held in its place, with the payload
         * `singleOrchestratorContinuationPayload` builds from the held one.
         */
        rotateHandoff?: (held: HeldMessage) => boolean;
        /**
         * Called with the delay of every `{ timeoutSeconds }` result, so a
         * test with fake timers can let that time pass before the redelivery.
         */
        advanceClock?: (seconds: number) => void;
        /**
         * Coalesce like a VQS concurrency key: a keyed message (an orchestrator
         * message by `orchestratorRunIdOf`, so not a step message and not an
         * intermediate wait hop) enqueued undelayed while one of the run's
         * orchestrator deliveries runs is not held but counted on that
         * delivery, and a delivery that would acknowledge with messages
         * counted runs its handler again until none are, each re-run with the
         * next `deliveryCount` and the same `attempt`, as world-vercel reports
         * one. A delayed message is held; a test that lets one come due while
         * a delivery runs calls {@link AppendOnlyWorld.comeDue}.
         */
        coalesce?: boolean;
        /**
         * In `coalesce` mode, the most re-runs of one delivery; past them the
         * message is handed off (redelivered, not counted as an attempt), as
         * world-vercel does. Unbounded when absent.
         */
        maxCoalescedReruns?: number;
        /**
         * Called before every `events.create`, before anything is checked or
         * written. A test throws from it to refuse a write, or awaits in it to
         * hold one back.
         */
        beforeCreate?: (data: {
            eventType: string;
            eventData?: Record<string, unknown>;
        }, params: CreateEventParams | undefined, 
        /** Whether the event is an item of a `createBatch` call. */
        source?: {
            batch: boolean;
        }) => void | Promise<void>;
        /**
         * Called before every `events.list`, after the call is recorded. A test
         * awaits in it to hold a read back, as a remote World's read that is
         * held in transit.
         */
        beforeList?: (params: ListEventsParams) => void | Promise<void>;
        /**
         * How long the queue deduplicates an idempotency key after the send
         * that made it held a message, in ms of the (possibly faked) system
         * clock, whether that message is still held, being delivered, or was
         * acknowledged. Past it a send under the key is a new message, as on a
         * queue with a finite dedupe window (world-vercel's is 24 hours).
         * Absent: a key is deduplicated for as long as the fake lives.
         */
        keyDedupeWindowMs?: number;
    });
    /** Seed a run as if `run_created` had been written. */
    seedRun(run: Omit<WorkflowRun, 'specVersion'> & {
        specVersion?: number;
    }): void;
    /**
     * Seed a run with an existing log, as a fresh process would find it: the
     * events keep their ids, and every position counts as in-band, so the next
     * orchestrator delivery adopts it all from the snapshot.
     */
    seedLog(run: Omit<WorkflowRun, 'specVersion'> & {
        specVersion?: number;
    }, events: readonly Event[]): void;
    /**
     * A `run_started` for a run this World never saw (`run_created` did not
     * land) creates the run from the creation data it carries, as a World does
     * for resilient start. The creation counts as the run's first in-band
     * position.
     */
    private createRunFromStart;
    /** Append an event as an out-of-band writer would. */
    appendOutOfBand(event: Partial<Event>): Event;
    /**
     * The step-event shape a single-orchestrator World requires (world-vercel
     * refuses it otherwise): every step event names its step, and a start,
     * retry or failure carries the attempt.
     */
    private checkStepEventData;
    private append;
    private applyToRun;
    private checkFence;
    private checkRunAcceptsWork;
    private report;
    /** Replay events as a page with `resolveData` serves them. */
    private served;
    /** The event a `hook_created` create commits. */
    private committedHook;
    /**
     * Deliver one held message to the registered queue handler, the way a
     * queue would: a `{ timeoutSeconds }` result keeps the same message (same
     * id, next delivery count); anything else acknowledges it; a rejection
     * keeps it too.
     */
    deliver(held: HeldMessage): Promise<unknown>;
    /**
     * Lets a held (delayed) message come due now, as the queue's clock would.
     * In `coalesce` mode, a keyed one (see `coalesce`) that comes due while an
     * orchestrator delivery of the run runs is coalesced into it: no longer
     * held, never delivered, and counted on that delivery, which runs again.
     * Returns whether it was coalesced; otherwise it stays held for the test
     * to deliver.
     */
    comeDue(held: HeldMessage): boolean;
    private deliverOnce;
    private deliverOnceKeyed;
    /** Enqueue a message as `start()` or a test would. */
    enqueue(queueName: string, message: unknown): HeldMessage;
    /**
     * Deliver held messages, oldest first, until none is left or `limit`
     * deliveries were made. Delays are ignored.
     */
    runUntilIdle(limit?: number): Promise<void>;
    /**
     * Deliver held messages in the order the queue's clock makes them due,
     * moving the (faked) system clock to each one's due time
     * (`HeldMessage.dueAtMs`), until none is left or `limit` deliveries were
     * made. Among messages due at the same time, `prefer` picks which go first
     * (oldest first otherwise): an orchestrator wake ahead of a step message
     * gives each step outcome its own orchestrator delivery. `deliverAs`
     * changes how a message is delivered (as a coalesced re-run, say). Needs a
     * faked `Date` (`vi.useFakeTimers({ toFake: ['Date'] })`).
     */
    runOnClock(options?: {
        limit?: number;
        prefer?: (held: HeldMessage) => boolean;
        deliverAs?: (held: HeldMessage) => HeldMessage;
    }): Promise<void>;
    /** The created event as a create response carries it. */
    private responseEvent;
    /** Commits a batch write; see `createBatch` in {@link asWorld}. */
    private commitBatch;
    asWorld(): World;
}
//# sourceMappingURL=append-only-world.d.ts.map