import { type Event, type World } from '#compiled/@workflow/world/index.js';
/**
 * Default interval of the orchestrator's log-tail poll while no live push
 * covers the run, in milliseconds: the World has no `events.subscribe`, the
 * subscription failed or ended, or the push showed it missed an event.
 */
export declare const DEFAULT_ORCHESTRATOR_POLL_INTERVAL_MS = 2000;
/**
 * Interval of the orchestrator's log-tail poll while no live push covers the
 * run (`WORKFLOW_ORCHESTRATOR_POLL_INTERVAL_MS`, default
 * {@link DEFAULT_ORCHESTRATOR_POLL_INTERVAL_MS}). `0` disables polling, which
 * leaves the live feed (when the World has one) and queue wakes.
 */
export declare function getOrchestratorPollIntervalMs(env?: Record<string, string | undefined>): number;
/**
 * Default interval of the log-tail poll while the World's live push is up,
 * in milliseconds. The poll is then only the safety net for a push that
 * never arrives without any sign: the push is dense and in slot order, and a
 * closed or ended subscription reports itself (see {@link LiveLogFeed}).
 */
export declare const DEFAULT_ORCHESTRATOR_FEED_POLL_INTERVAL_MS = 10000;
/**
 * Interval of the log-tail poll while the live push is up
 * (`WORKFLOW_ORCHESTRATOR_FEED_POLL_INTERVAL_MS`, default
 * {@link DEFAULT_ORCHESTRATOR_FEED_POLL_INTERVAL_MS}). {@link LiveLogFeed}
 * never polls more often than its interval without a push, so `0` means the
 * same interval as without one.
 */
export declare function getOrchestratorFeedPollIntervalMs(env?: Record<string, string | undefined>): number;
/**
 * How far the log-tail poll's interval backs off while the live feed is
 * healthy: up to this many times the live-push interval. Each poll that finds
 * nothing the feed had not already delivered doubles the interval; any sign
 * of feed trouble puts it back at the interval without a push.
 */
export declare const ORCHESTRATOR_POLL_MAX_BACKOFF_FACTOR = 2;
/** Default of {@link getOrchestratorLingerMs}, in milliseconds. */
export declare const DEFAULT_ORCHESTRATOR_LINGER_MS = 30000;
/**
 * How long an orchestrator delivery stays live after its last pass found
 * nothing to run, while the run still waits on work done elsewhere: an open
 * hook or a background step (`WORKFLOW_ORCHESTRATOR_LINGER_MS`, default
 * {@link DEFAULT_ORCHESTRATOR_LINGER_MS}). Every event another writer appends
 * in that time starts a new pass in the same delivery, and the next pass that
 * finds nothing to run starts the time again, so a burst of resumes or step
 * outcomes is handled by one warm invocation instead of one queued wake each.
 * Only taken while the World's live feed (`events.subscribe`) is live: a
 * World without one, a subscription that failed, or one that goes down
 * during the linger ends it, since waiting on the poll alone costs a
 * function held open for a poll's latency (`LiveLogFeed.isLive`). Any open hook is
 * enough to take it (see `awaitsExternalWork`), so a run with a long-lived
 * hook holds each of its deliveries this long after its last pass. `0`
 * disables it.
 */
export declare function getOrchestratorLingerMs(env?: Record<string, string | undefined>): number;
/**
 * Feeds the events other writers append to a run into a live orchestrator,
 * in slot order and without gaps.
 *
 * Two sources: the World's optional `events.subscribe` push, and a poll of
 * the log tail. An event is accepted only when it occupies exactly the next
 * slot after the last accepted one, so a late, duplicated or out-of-order
 * push is dropped and the poll fills in. Correctness never depends on the
 * push.
 *
 * The poll is the safety net for a push that never arrives, so it runs at the
 * live-push interval only while the push is demonstrably keeping up: the
 * subscription is live and the previous poll found nothing the push had not
 * already delivered. It starts there when the subscription opens, and each
 * clean poll doubles the interval, up to
 * {@link ORCHESTRATOR_POLL_MAX_BACKOFF_FACTOR} times the live-push interval.
 * A feed error, a failed poll, a poll that delivers an event the push missed,
 * or a pushed event that leaves a gap behind it puts the interval back at the
 * one without a push at once, rescheduling a poll that was due later.
 *
 * What the push can miss without a sign is only the newest event, with
 * nothing pushed after it and the socket still open: a later push would show
 * the gap, and a closed socket or an ended subscription calls `onError`. The
 * capped backoff bounds how long such an event waits for the poll.
 */
export declare class LiveLogFeed {
    private readonly world;
    private readonly runId;
    private nextSlot;
    private unsubscribe;
    private timer;
    private polling;
    private stopped;
    private cursor;
    private readonly pending;
    /** Whether the World's push subscription is live. */
    private feedLive;
    /** The interval the next scheduled poll waits. */
    private currentIntervalMs;
    /** When the scheduled poll is due, if one is scheduled. */
    private timerDueAtMs;
    constructor(world: Pick<World, 'events'>, runId: string, options: {
        /** Highest slot the orchestrator already holds. */
        afterSlot: number;
        /** `events.list` cursor positioned after that slot. */
        cursor: string | null;
        /** Poll interval while no live push covers the run; `0` never polls. */
        pollIntervalMs: number;
        /**
         * Poll interval while the live push is up. Never below
         * `pollIntervalMs`; defaults to it.
         */
        feedPollIntervalMs?: number;
        onEvents: (events: Event[]) => void;
        /**
         * Called once when a live push subscription goes down: `onError`, or
         * `subscribe` throwing. Not called for {@link stop}, nor when the World
         * has no `events.subscribe` (the feed is then never live).
         */
        onFeedDown?: () => void;
    });
    /**
     * Whether the World's push subscription is live: it was opened and has
     * reported no error, and the feed is not stopped. A subscription that
     * never acknowledges and never errors still counts as live; the capped
     * poll backoff bounds what it can miss.
     */
    get isLive(): boolean;
    /** The interval the next scheduled poll waits, in milliseconds. */
    get nextPollIntervalMs(): number;
    private readonly pollIntervalMs;
    private readonly feedPollIntervalMs;
    private readonly onEvents;
    private readonly onFeedDown;
    start(): void;
    /** Reports a subscription that went down, unless the feed is stopped. */
    private feedDown;
    stop(): void;
    /**
     * Poll once now, outside the schedule. Each page read runs under the
     * orchestrator's read deadline, once: a poll that runs out of time ends,
     * and the next scheduled one asks again from the same cursor, instead of
     * one held read stopping every later poll.
     */
    pollNow(): Promise<void>;
    private schedulePoll;
    /**
     * Back to the interval without a push: the push may be missing events. A poll
     * scheduled later than one interval from now is moved up to it; one in
     * flight schedules the next at the configured interval when it ends.
     */
    private feedTrouble;
    /** Accepts what continues the slot sequence; returns how many it passed on. */
    private offer;
}
//# sourceMappingURL=live-feed.d.ts.map