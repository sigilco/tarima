import type { Event } from '#compiled/@workflow/world/index.js';
/**
 * Delay before firing the deferred unconsumed-event check after the promise
 * queue has drained. Must be long enough for cross-VM microtask chains to
 * propagate (resolve in host → workflow code in VM → subscribe call back
 * in host). Any subscribe() arriving during this window cancels the check.
 */
export declare const DEFERRED_CHECK_DELAY_MS = 100;
/**
 * Floor for the deferred-check delay, so a too-low override can't manufacture
 * spurious divergence (each false positive burns a divergence-recovery retry
 * and can escalate to a terminal `CorruptedEventLogError`).
 *
 * Exported so tests needing the shortest legal delay can ask for it instead of
 * hardcoding a number this floor would silently clamp up.
 */
export declare const MIN_DEFERRED_CHECK_DELAY_MS = 10;
export declare enum EventConsumerResult {
    /**
     * Callback consumed the event, but should not be removed from the callbacks list
     */
    Consumed = 0,
    /**
     * Callback did not consume the event, so it should be passed to the next callback
     */
    NotConsumed = 1,
    /**
     * Callback consumed the event, and should be removed from the callbacks list
     */
    Finished = 2
}
type EventConsumerCallback = (event: Event | null) => EventConsumerResult;
/** Options of {@link EventsConsumer.subscribe}. */
export interface SubscribeOptions {
    /**
     * The only correlation id whose events the callback can consume. A keyed
     * callback is a promise that, for any event with another correlation id
     * (or none), it returns `NotConsumed` and does nothing else, so the walk
     * skips it for those events instead of calling it. It is still offered the
     * end-of-log `null`, and every event of its own correlation id, in its
     * registration position among all callbacks.
     */
    correlationId?: string;
}
export interface EventsConsumerOptions {
    /**
     * Observation callback invoked after an event has been consumed (not for one
     * the walk merely inspected, parked, or skipped). Diagnostics and tests read
     * it. Do NOT anchor the workflow's deterministic clock here: consumption runs
     * ahead of delivery, so a later event's time would leak into an earlier
     * delivery's cascade; the clock advances from `registerDeliveryBarrier`
     * when a delivery is handed to the workflow.
     */
    onConsumedEvent?: (event: Event) => void;
    /**
     * Callback invoked when a non-null event cannot be consumed by any registered
     * callback, indicating an orphaned or invalid event in the event log. The
     * check is deferred until after the promise queue has drained, ensuring that
     * any pending async work (e.g., deserialization/decryption) completes and
     * downstream subscribe() calls have a chance to cancel the check first.
     */
    onUnconsumedEvent: (event: Event) => void;
    /**
     * Callback invoked when an event is skipped because it repeats an event
     * class the walk already consumed for the same entity. `firstEventType` is
     * the type that recorded the class, which is the one the workflow observed.
     * Diagnostics only: skipping is a normal outcome, not an error, though a
     * `firstEventType` differing from `event.eventType` says the two writers
     * decided the entity's outcome differently, which is worth more than an
     * info log.
     */
    onDuplicateEvent?: (event: Event, firstEventType: Event['eventType']) => void;
    /**
     * Returns the current promise queue. The unconsumed event check is chained
     * onto this queue so it only fires after all pending async work (e.g.,
     * deserialization) has completed. This prevents false positives when async
     * deserialization delays the resolve() that triggers the next subscribe().
     */
    getPromiseQueue: () => Promise<void>;
    /**
     * Whether no data delivery is in flight (`isDeliveryIdle` in private.ts).
     * The unconsumed-event check waits for this before it fires: a delivery in
     * flight means the workflow VM is mid-reaction, and an event it has not
     * claimed yet is an event it has not reached yet.
     *
     * Required rather than defaulting to always-idle: always-idle is exactly the
     * pre-gate behavior, so a defaulted option would let a construction site opt
     * a whole replay path back out without saying so. Tests that drive a consumer
     * with no orchestrator context pass `() => true` to keep the pre-existing
     * timing, and say so at the call site.
     */
    isDeliveryIdle: () => boolean;
    /**
     * The run's start Hook id (`startHookId(runId)`), for a run started with
     * `start(workflow, args, { experimental_hook })`. That Hook exists from the run's
     * admission, so payloads can be resumed into it before the body calls
     * `createHook` (even before `run_started`), and another run can force-claim
     * it before then too.
     *
     * An unclaimed `hook_received` for this id, or a `hook_disposed` carrying
     * `forceClaimedBy` for it, is parked at once at its log index instead of
     * after the deferred check: the same index and the same later drain the
     * timer would reach, without blocking the walk for the window on every
     * replay. The workflow may also never claim the Hook (the token used only
     * as an idempotency key), so these parked events never fail a run:
     * {@link EventsConsumer.strandedEvent} and the end-of-log check skip them,
     * and {@link EventsConsumer.parkedSummary} counts them separately.
     *
     * `undefined` for every other run, which behaves exactly as before.
     */
    eagerParkCorrelationId?: string;
}
/**
 * See {@link EventsConsumer.parkedSummary}. `count`, `eventId` and `eventType`
 * describe the parked events other than unclaimed start Hook deliveries
 * (`eventId`/`eventType` are absent when there are none), which are counted
 * in `unclaimedStartHook` instead (absent when zero, and always absent for a
 * run without a start Hook).
 */
export interface ParkedSummary {
    count: number;
    eventId?: string;
    eventType?: Event['eventType'];
    unclaimedStartHook?: number;
}
/** See {@link EventsConsumer.describe}. */
export interface EventsConsumerSnapshot {
    index: number;
    length: number;
    parked: number;
    lastConsumedEventId: string | undefined;
}
export declare class EventsConsumer {
    eventIndex: number;
    readonly events: Event[];
    readonly callbacks: EventConsumerCallback[];
    /**
     * {@link callbacks}' registrations, index for index, with the correlation
     * id each one was keyed to (see {@link EventsConsumer.subscribe}).
     */
    private readonly registrations;
    /** Unkeyed registrations, in registration order. */
    private readonly unkeyed;
    /** Keyed registrations by correlation id, each in registration order. */
    private readonly keyed;
    private nextRegistrationSeq;
    /**
     * Events the ordered walk stepped over because nobody claimed them and their
     * type carries no ordering claim. Each keeps the index it held in the log:
     * consumers read {@link eventIndex} at consumption time to order their
     * delivery against the rest of the log, and a late delivery must still make
     * the claim its position gave it.
     *
     * Held in log order, drained in log order, and drained before every offer so
     * a consumer registered after the walk passed the event still receives it.
     */
    private readonly parked;
    /**
     * Correlation ids of the {@link ONE_SHOT_EVENT_TYPES} events consumed so
     * far, so a second resolution for one of them is recognized as unclaimable
     * rather than parked for a consumer that cannot exist.
     */
    private readonly resolved;
    /**
     * `<class>:<correlationId>` for every event class the walk has already
     * consumed, mapped to the event type that recorded it. The type is kept so a
     * repeat that decided the same class *differently* (a `step_failed` behind a
     * `step_completed`) can be reported as more than a re-commit. See
     * {@link EventsConsumer.firstEventTypeOfClass}.
     */
    private readonly seenEventClasses;
    /** Correlation ids whose terminal event was consumed, with its type. */
    private readonly closedEntities;
    private onConsumedEvent?;
    private onUnconsumedEvent;
    private onDuplicateEvent?;
    private getPromiseQueue;
    private isDeliveryIdle;
    private readonly eagerParkCorrelationId;
    /**
     * Whether the body has opened the start Hook: until then nothing can claim
     * its parked deliveries, so the drain does not offer them (see
     * {@link startHookOpened}).
     */
    private startHookOpen;
    private pendingUnconsumedCheck;
    private pendingUnconsumedTimeout;
    private unconsumedCheckVersion;
    /**
     * The event a callback most recently claimed, for {@link describe}. Tracked
     * separately from {@link eventIndex} because the walk also steps over events
     * (parked, sealed no-ops, duplicates) without anyone consuming them, so
     * `events[eventIndex - 1]` does not say what replay last acted on.
     */
    private lastConsumed;
    constructor(events: Event[], options: EventsConsumerOptions);
    /**
     * The body opened the start Hook (its `createHook({ token })` bound to it).
     * Its parked deliveries are offered from the next drain on; before this,
     * offering each of them to every callback on every pass would cost the
     * whole replay for a run that never opens the Hook.
     */
    startHookOpened(): void;
    /**
     * Whether `event` is a delivery for the run's start Hook that may wait,
     * parked, for a `createHook` the body has not reached, or never reaches.
     * See {@link EventsConsumerOptions.eagerParkCorrelationId}.
     */
    private isStartHookEvent;
    /** The oldest parked event that is not an unclaimed start Hook delivery. */
    private oldestStrandable;
    /**
     * The oldest event the walk stepped over that no consumer has claimed yet,
     * if any. Parking is a bet that a consumer will be registered later, so at
     * any point where no consumer ever will be again (the replay finishing is
     * the definitive one), this answers which event the bet lost on.
     */
    get strandedEvent(): Event | undefined;
    /**
     * What the walk is still holding, or `undefined` when it holds nothing.
     *
     * Read at every point a replay stops, including the suspensions that are not
     * settling points, so the held state reaches telemetry. A replay cannot tell
     * a delivery awaiting a later consumer from one no consumer will ever
     * register, so it reports rather than decides: the same `eventId` reported on
     * suspension after suspension of one run is the shape that says the bet
     * parking made is not going to pay off, and that shape is only visible across
     * replays.
     */
    get parkedSummary(): ParkedSummary | undefined;
    /**
     * Where the walk stands, for a divergence message. Everything here is
     * already known to the consumer; the point of the method is that the
     * orchestrator can print it without reaching into private state.
     *
     * `index` is the ordered walk's position (the offset of the event it is
     * stuck on, when it is stuck), `length` the log as this consumer holds it,
     * `parked` how many events the walk stepped over and still holds, and
     * `lastConsumedEventId` the id of the event a callback most recently
     * claimed, `undefined` before the first claim.
     */
    describe(): EventsConsumerSnapshot;
    append(events: Event[]): void;
    /**
     * Registers a callback function to be called after an event has been consumed
     * by a different callback. The callback can return:
     *  - `EventConsumerResult.Consumed` the event is considered consumed and will not be passed to any other callback, but the callback will remain in the callbacks list
     *  - `EventConsumerResult.NotConsumed` the event is passed to the next callback
     *  - `EventConsumerResult.Finished` the event is considered consumed and the callback is removed from the callbacks list
     *
     * @param fn - The callback function to register.
     * @param options - See {@link SubscribeOptions}.
     */
    subscribe(fn: EventConsumerCallback, options?: SubscribeOptions): void;
    /**
     * {@link subscribe} keyed to `correlationId` (see
     * `SubscribeOptions.correlationId`).
     */
    subscribeFor(correlationId: string, fn: EventConsumerCallback): void;
    private register;
    private notifyConsumedEvent;
    private consume;
    /**
     * Offer `currentEvent` to each registered callback in turn. Returns true
     * when a callback consumed it. Does not move {@link eventIndex}: the ordered
     * walk and the parked drain advance differently, so each does its own.
     */
    private offer;
    /** The registrations that may consume `event`, in registration order. */
    private candidatesFor;
    /** Removes a finished callback from every index. */
    private unregister;
    /**
     * Offer everything parked, oldest first, until a pass claims nothing.
     *
     * Each offer runs with {@link eventIndex} moved back to the position the
     * parked event held in the log, because that is the position its consumer
     * will register a delivery barrier under. Restoring the walk pointer
     * afterwards is what keeps the two pointers from interfering.
     */
    private drainParked;
    /**
     * Release anything parked whose class a consumption has since recorded for
     * the same entity, on the same terms as {@link skipDuplicateEvent}.
     *
     * The ordered walk decides a straggler at the event, but only for one of the
     * two orders the copies can arrive in. When neither copy has a consumer yet,
     * both park — the walk steps over the first and re-enters immediately, so
     * the second is offered in the same tick, with no class recorded because
     * nothing has been *consumed*. The drain then claims the first and the
     * second is left held by a consumer list that will never grow the callback
     * it needs, which the workflow function returning reports through
     * {@link strandedEvent} as a replay divergence.
     *
     * Run before each offer pass rather than once, because the consumption that
     * records the class happens inside the drain itself.
     *
     * Not specific to `attr_set`: `wait_completed` reaches the same state, and
     * {@link ONE_SHOT_EVENT_TYPES} only covers it in the order where the
     * consumption came first.
     */
    private dropParkedDuplicates;
    /**
     * Step the ordered walk over an event nobody claimed, holding on to it for a
     * later consumer. Returns false when the event's type makes its position a
     * decision record, which is the one case where nobody claiming it means the
     * replay diverged.
     */
    private park;
    /**
     * Park a start Hook delivery at once, at its log index, without waiting out
     * the deferred check: no consumer can be on its way for it, since the only
     * one is the body's `createHook` with the start token, which may come much
     * later. Covers `hook_disposed{forceClaimedBy}` too, which {@link park}
     * refuses for every other id. See
     * {@link EventsConsumerOptions.eagerParkCorrelationId}.
     */
    private parkStartHookEvent;
    /**
     * The key `event`'s class is tracked under, or `undefined` for the events
     * that belong to no class and are therefore never skipped: the types with no
     * entry at all (`hook_received`, `hook_conflict`, `run_created`), and a
     * classed type carrying no entity to track it under.
     *
     * {@link classifyEntityEvent} owns that rule, because the observability UI
     * decides the same question about the same log and the two must not drift.
     */
    private eventClassKey;
    /**
     * Remembers that `event`'s class is now decided for its entity, if the type
     * belongs to a class. First writer wins: the recorded type is the one the
     * workflow observed, and a later repeat is measured against it.
     */
    private recordEventClass;
    /**
     * The type that already decided `event`'s class for the same entity, or
     * `undefined` when nothing has: a second `step_created` for one step, a
     * second terminal outcome, a second `step_started` after the step's result is
     * already in the log.
     *
     * Such an event is committed but inert. Concurrent replays write into one
     * log without a currency guard, so a replay working from a prefix that
     * predates another replay's write can commit its own copy of work the log
     * already records. That copy cannot change what the workflow observed: the
     * outcome was decided by the first event of the class and every later replay
     * reads that same event at the same log position, so ignoring the straggler
     * is deterministic across replays.
     *
     * Classes are tracked separately, so passing one does not suppress another.
     * A step whose result is in the log still reaches its `step_created` and
     * `step_started` consumers if it has yet to see those classes.
     *
     * Consulted only after every registered callback has declined the event, so
     * it can never take an event a consumer wanted. A retry's `step_started` is
     * claimed by the step's live consumer and counts as an attempt exactly as
     * before, and a second `step_created` reaching a step that has not finished
     * is likewise consumed rather than skipped; only the copies nobody claims are
     * skipped.
     *
     * Unlike the divergence report, this does *not* wait out the deferred window
     * first, and it does not need to. The window buys time for a consumer that
     * has yet to register, and no such consumer can want this event: the class
     * was recorded by a consumption in this same replay, which means the entity's
     * consumer was registered and took an event of this class, and correlation
     * ids are minted from a monotonic ULID per body position, so nothing later in
     * the body registers a second consumer under this id. Waiting would cost
     * `getDeferredCheckDelayMs()` per straggler per replay for information that
     * cannot arrive: 0.75% of production runs carry at least one straggler, and
     * the p99 among those carries 155.
     *
     * The invariant to preserve if hook identity ever becomes caller-supplied
     * (an idempotency key rather than a minted id): two `createHook` calls in one
     * body could then share a correlation id, and the second consumer's
     * `hook_created` would be a repeat of a class this replay already recorded.
     * That would make skipping wrong for `hook_created`, and is the reason the
     * class map lives next to the event types rather than being inferred.
     */
    private firstEventTypeOfClass;
    /**
     * Steps the walk over a sealed-log `noop` (specVersion >= 7): the World's
     * backend wrote it to occupy a slot whose writer allocated the position and
     * died, so the log's density arithmetic holds. It is invisible to the
     * workflow: no consumer is offered it, no event class is recorded, and the
     * deterministic clock does not advance, exactly as with
     * {@link skipDuplicateEvent}, so a log that happens to contain one produces the same
     * timestamps as a log that does not. (Its `createdAt` is the seal time,
     * which can even postdate later slots' events; letting it touch the clock
     * would leak the sealer's wall clock into replay.)
     */
    private skipSealedNoop;
    /** Steps the walk over a repeat of an already-consumed class. */
    private skipDuplicateEvent;
    private handleEndOfLog;
    private scheduleUnconsumedCheck;
    /**
     * Decide what a still-unconsumed event is, now that the promise queue has
     * drained and the delivery gate says the VM is not mid-reaction.
     *
     * `mayPark` is false only for the end-of-log recheck of an event {@link park}
     * already holds. Nothing in the first branch applies to one of those: it is
     * not the event at the cursor, so the identity guard is not meaningful, and
     * it is parked already.
     *
     * A duplicate class never arrives here. {@link consume} steps over one in the
     * pass that offered it, before this check is ever scheduled, and a class
     * recorded while the check was in flight can only have been recorded by a
     * consumption inside {@link consume}, whose next pass re-offers this event
     * and steps over it there, leaving the identity guard above to drop the
     * in-flight check. One that parks before any consumption records its class
     * is released later by {@link dropParkedDuplicates} instead.
     */
    private resolveUnconsumedEvent;
    /**
     * Run `fn` once no data delivery is in flight, polling the way
     * `scheduleWhenIdle` does: let the promise queue drain, re-check a timer
     * tick later, repeat.
     *
     * Without this the check is a bet that every delivery the walk is running
     * ahead of lands inside a fixed window. Consumption is synchronous while the
     * resolution it triggers is not: a step result hydrates in the host, resolves
     * from a detached continuation behind `awaitEarlierDeliveries`, and only then
     * does VM code run far enough to subscribe the next consumer. Replaying a
     * batch of N parallel step results leaves N-1 of them on that detached path
     * with the queue already drained, so the walk sits on the ordered event the
     * VM is about to draw and the window is the only thing standing between a
     * healthy run and `ReplayDivergenceError`.
     *
     * Shortening the window shows that mechanism directly: on identical event logs
     * the local race repro corrupts 34 of 42 runs at a 10ms window and 0 of 114 at
     * the 100ms default. That measures how the bet loses, not that the default
     * loses it, and no measurement of a delivery outrunning 100ms exists either
     * way. So read this as retiring the bet rather than as repairing an observed
     * failure of that number: the delay is a user-settable env override, which
     * leaves the old behavior one configuration away from losing on any backend.
     *
     * Termination is `hasParkedCommittedDelivery`'s: it counts only deliveries
     * that resolve on their own, so nothing here can gate its own retirement. A
     * genuinely orphaned event has no delivery to wait on and reaches `fn` on the
     * first poll.
     *
     * What the gate gives up: for the ordered events that still reach
     * `onUnconsumedEvent` rather than {@link park}, this stops being the thing
     * that catches a diverged log while a delivery is in flight. The suspension
     * and this check now wake from the same `isDeliveryIdle` edge, and
     * `scheduleWhenIdle` fires on the first timer tick after idle while this waits
     * a further `getDeferredCheckDelayMs()`. So a run with a pending `sleep()`
     * suspends first, and `onWorkflowError` drops the divergence arriving second
     * (its `'suspended'` branch demotes to `'replay'` and surfaces nothing),
     * leaving a later `resume()` to decline into a cold replay. Pre-gate the
     * suspension already won that race whenever the delivery landed inside the
     * fixed window, so what changed is that the outcome stopped depending on
     * timing. Nothing should treat this check as the mechanism that reports
     * divergence on a log the run is still delivering into.
     */
    private whenDeliveryIdle;
}
export {};
//# sourceMappingURL=events-consumer.d.ts.map