/**
 * Utils used by the bundler when transforming code
 */
import type { WorldCapabilities } from '#compiled/@workflow/world/index.js';
import type { EventsConsumer } from './events-consumer.js';
import { type QueueItem } from './global.js';
import type { ReplayPayloadCache } from './replay-payload-cache.js';
import type { Serializable } from './schemas.js';
import type { PayloadKey } from './serialization/encryption.js';
export type StepFunction<Args extends Serializable[] = any[], Result extends Serializable | unknown = unknown> = ((...args: Args) => Promise<Result>) & {
    maxRetries?: number;
    stepId?: string;
};
/**
 * Register a step function to be served in the server bundle.
 * Also sets the stepId property on the function for serialization support.
 *
 * Note: The SWC compiler plugin no longer generates calls to this function.
 * Step registration is now inlined as a self-contained IIFE that writes
 * directly to the global Map at Symbol.for("@workflow/core//registeredSteps").
 * This function is kept for internal/test use only.
 */
export declare function registerStepFunction(stepId: string, stepFn: StepFunction): void;
/**
 * Find a registered step function by name
 */
export declare function getStepFunction(stepId: string): StepFunction | undefined;
export interface WorkflowOrchestratorContext {
    runId: string;
    encryptionKey: PayloadKey | undefined;
    worldCapabilities?: WorldCapabilities;
    /**
     * The run's start Hook (`start(workflow, args, { experimental_hook })`), fixed when the
     * session is created; `undefined` for a run started without one. The first
     * `createHook({ token })` with this token binds to `hookId` (setting
     * `bound`) instead of minting an id and writing `hook_created`: the
     * admission that created the run created this Hook.
     */
    startHook?: {
        token: string;
        hookId: string;
        /** `start({ experimental_hook })`'s retention deadline, when one was set. */
        tokenRetentionUntil?: Date;
        bound: boolean;
    };
    globalThis: typeof globalThis;
    /**
     * Increments when a suspension is accepted and on every retained-session
     * resume. Step, hook, wait, and attribute suspension signals capture it when
     * scheduled and no-op if it moved, which drops same-boundary sibling signals
     * and timers queued at boundary N that would fire after the session resumed
     * into boundary N+1.
     */
    suspensionGeneration: number;
    /**
     * The {@link suspensionGeneration} whose idle poll
     * ({@link scheduleWorkflowSuspension}) is running, if one is. Every pending
     * consumer signals the end of the log, so one boundary of an N-wide fan-out
     * raises N signals; they share this one poll instead of each running its
     * own. Optional so lightweight test contexts need not set it.
     */
    suspensionPollGeneration?: number;
    eventsConsumer: EventsConsumer;
    /**
     * Map of pending invocations keyed by correlationId.
     * Using Map instead of Array for O(1) lookup/delete operations.
     */
    invocationsQueue: Map<string, QueueItem>;
    /**
     * Per open hook, a probe for whether workflow code is currently waiting on
     * its next payload (an `await hook`, a pending `for await` iteration, or a
     * `.then` on it). Registered by `createHook` and dropped once the hook can
     * receive nothing more. Snapshotted into
     * {@link WorkflowSuspension.observedHookIds} when a suspension is raised.
     *
     * Optional so older/out-of-tree contexts (and lightweight test harnesses)
     * degrade to "every open hook is observed".
     */
    hookPayloadAwaiters?: Map<string, () => boolean>;
    onWorkflowError: (error: Error) => void;
    /**
     * Mints the ULID body of a correlation id. Every entity a replay creates
     * draws from this one monotonic sequence, so an id is an ordinal over the
     * whole run and both replays of a run must draw in the same order.
     */
    generateUlid: () => string;
    /**
     * Monotone count of correlation-id draws this replay has made. Progress
     * metric for {@link quiesceEarlierCascades}: a macrotask turn in which it
     * does not move (and no hydration is in flight) means every woken branch has
     * run as far as it can without another delivery. Optional so lightweight
     * test contexts degrade to the single-yield behavior.
     */
    readonly mintCount?: number;
    generateNanoid: () => string;
    /**
     * Sequential promise queue that ensures all event-driven promise resolutions
     * (step results, hook payloads, failures, suspensions) happen in event log
     * order. Every resolve, reject, or workflow error is chained through this
     * queue so that even if individual operations take variable time (e.g.,
     * async decryption), promises resolve deterministically.
     */
    promiseQueue: Promise<void>;
    /**
     * Counter of in-flight async data delivery operations (step result
     * hydration, hook payload hydration, abort signal hydration). Suspensions
     * must wait for this to reach 0 before firing, to avoid preempting data
     * delivery, e.g. dehydrating a step's arguments while an abort that should
     * be reflected in those arguments is still hydrating its reason.
     */
    pendingDeliveries: number;
    /**
     * Ordered registry of in-flight "branch-deciding" deliveries: the
     * resolutions a workflow typically `Promise.race`s on, or awaits from
     * independent concurrent branches: hook payloads (`hook_received`), hook
     * registration outcomes (`hook_created` / `hook_conflict`), wait completions
     * (`wait_completed`), and step results (`step_completed` / `step_failed`).
     * Keyed by the delivery's position (index) in the consumed event log.
     *
     * The problem: each of these resolutions reaches workflow code after a
     * different, workload-dependent number of microtask hops. A buffered hook
     * payload is observed via the async hook iterator (`yield await this`),
     * costing extra hops; a `wait_completed` resolves with fewer, and a reused
     * sleep can resolve in an entirely earlier loop iteration; a step result is
     * gated on hydration whose cost varies between replays of the SAME
     * invocation: the first replay pays the full decrypt/decompress/revive,
     * while later replays sharing the invocation's `ReplayPayloadCache`
     * memo-hit small primitive results and resolve in one or two hops. Either
     * way, the resolution that the committed event log ordered first can lose a
     * `Promise.race` (or a `useStep` ULID allocation) to a faster- or
     * already-resolved competitor, diverging from the log and surfacing as
     * `CorruptedEventLogError`.
     *
     * The fix is a strict, deterministic delivery order anchored on
     * event-log position: a delivery does not resolve to the workflow until
     * every relevant earlier-in-log delivery has been delivered. Because the
     * gate is "the earlier delivery resolved", not "won a timing race", the
     * outcome is independent of microtask hops, hydration/decryption time,
     * and `Promise.race` argument order. Which earlier kinds a delivery defers
     * behind is spelled out on {@link awaitEarlierDeliveries}.
     *
     * Index is used rather than the `eventId` string because `eventId` is an
     * opaque, world-assigned value not guaranteed to sort in creation order
     * (only the bundled ULID worlds happen to).
     *
     * Optional so older/out-of-tree contexts (and lightweight test harnesses)
     * that do not initialize it degrade gracefully to the previous behavior.
     */
    pendingDeliveryBarriers?: Map<number, DeliveryBarrierEntry>;
    /**
     * Advance the workflow's deterministic clock (`Date.now()` inside the VM)
     * to `at`, never backwards. Called by {@link registerDeliveryBarrier} when a
     * branch-deciding delivery is handed to the workflow, so the clock a
     * cascade observes is the timestamp of the delivery that woke it.
     *
     * The clock is NOT advanced when an event is merely consumed. The
     * `EventsConsumer` walks ahead of delivery: within one drain window it
     * consumes every event whose consumer exists, so a `hook_received` for a
     * hook the workflow has not read, or a `wait_completed` the body is still
     * hops away from observing, is consumed while an earlier delivery is
     * still parked on its barrier. Advancing the clock at consumption let those
     * later timestamps leak into the earlier delivery's cascade, and the value
     * `Date.now()` returned at a body position then depended on how much log
     * the replay had loaded: the execution that wrote the log saw the
     * heartbeat's time, a later replay holding one more payload saw the
     * payload's. A workflow whose control flow reads the clock (an idle loop
     * budgeted by `Date.now()`, a deadline) then drew different ordinals in
     * different replays and died `CORRUPTED_EVENT_LOG`.
     *
     * Optional so older/out-of-tree contexts degrade gracefully.
     */
    advanceClock?: (at: number) => void;
    /**
     * Invocation-scoped cache of prepared serialized payloads and immutable final
     * values. Prepared bytes survive fresh replay VMs; object graphs do not.
     */
    replayPayloadCache: ReplayPayloadCache;
}
/** The kind of branch-deciding delivery a barrier represents. */
export type DeliveryKind = 'hook' | 'wait' | 'step' | 'attribute';
interface DeliveryBarrierEntry {
    kind: DeliveryKind;
    /** Resolves once this delivery is handed to the workflow or retired. */
    released: Promise<void>;
    /**
     * Whether this delivery is committed to reaching the workflow without any
     * further action by workflow code. True for wait completions and step
     * results, which always resolve from their own chain, and for a hook payload
     * that already had a waiting consumer when it was consumed.
     *
     * False for a BUFFERED hook payload no consumer has claimed yet: it is
     * delivered by `claim()`, i.e. whenever the workflow next reads the hook,
     * which may be causally *after* a later-in-log delivery. `arm()` flips it
     * once a consumer takes the payload.
     */
    armed: boolean;
    /** Whether this entry has been removed and its `released` promise settled. */
    retired: boolean;
    /**
     * Retire this entry: resolve `released` and remove it from the registry,
     * without marking the handle delivered to the workflow. A safety-retired
     * buffered payload may therefore install a fresh entry if it is claimed by
     * a retained VM later. Called only by the context's safety-net dispenser
     * ({@link ensureBarrierSafetyNet}), and only on the lowest-index entry at
     * delivery idle. Idempotent.
     */
    retire: () => void;
}
export declare function awaitEarlierDeliveries(ctx: WorkflowOrchestratorContext, eventIndex: number | undefined, kind: DeliveryKind): Promise<void>;
/** Handle for a registered branch-deciding delivery barrier. */
export interface DeliveryBarrier {
    /**
     * Mark this delivery as delivered to the workflow. Resolves its
     * `released` promise so any later-in-log delivery gated on it (via
     * {@link awaitEarlierDeliveries}) may proceed, and removes it from the
     * registry. Idempotent.
     */
    markDelivered: () => void;
    /**
     * Mark this delivery as committed to happening, for a barrier registered
     * unarmed (a buffered hook payload) once a consumer has claimed it. From
     * then on a later step result may be ordered behind it. Idempotent.
     */
    arm: () => void;
}
/**
 * Register a branch-deciding delivery at its event-log index so that later
 * deliveries can be ordered strictly after it. Returns an inert handle when
 * `pendingDeliveryBarriers` is not initialized.
 *
 * Pass `armed: false` for a delivery whose resolution waits on workflow code
 * asking for it (a buffered hook payload); call `arm()` when it does.
 *
 * To guarantee a later delivery gated on this one can never hang when this
 * delivery is abandoned (the workflow took a different branch or is
 * suspending and never observes it), the barrier auto-resolves at idle.
 *
 * INVARIANT required of every call site: a barrier that is ever `armed` must
 * be paired with a delivery chain that runs unconditionally, attached when
 * the event is consumed (waits, step results, waiting-consumer hook payloads,
 * aborts), or by the `claim()` whose invocation is what arms it (buffered
 * hook payloads). The idle check ({@link scheduleWhenIdle}) refuses to
 * observe idle while an armed, self-resolving barrier is undelivered, and the
 * safety net below is itself idle-gated, so an armed barrier with no
 * unconditional chain would livelock every idle check in the run, including
 * its own retirement.
 */
export declare function registerDeliveryBarrier(ctx: WorkflowOrchestratorContext, eventIndex: number | undefined, kind: DeliveryKind, options: {
    armed?: boolean;
    /**
     * The delivered event's `createdAt`. On `markDelivered` the workflow
     * clock advances to it (see {@link WorkflowOrchestratorContext.advanceClock}),
     * so `Date.now()` in the cascade this delivery wakes reads the delivery's
     * own time, whatever the consumer walk has read ahead of it. Required so
     * that a new delivery site cannot forget the clock: a delivery that does
     * not move it leaves the cascade it wakes reading a stale time. `null`
     * opts out explicitly; attribute acknowledgements use it because they
     * have never moved the clock, and recorded histories may branch on it.
     */
    deliveredAt: number | null;
}): DeliveryBarrier;
/**
 * Whether some registered branch-deciding delivery is going to reach the
 * workflow without any further help (it is armed and not transitively parked
 * behind an unclaimed buffered payload, see {@link resolvesOnItsOwn}) but
 * has not been handed over yet.
 *
 * This is the delivery state `pendingDeliveries` cannot see. That counter
 * covers the hydration window inside a serial `promiseQueue` slot and is
 * released there, while the delivery's `resolve()` runs later, from a
 * detached continuation behind {@link awaitEarlierDeliveries}, including its
 * macrotask yield whenever the delivery had to defer. Replaying a batch of N
 * parallel step results consumed in one drain window leaves N-1 of them
 * parked on that yield with `pendingDeliveries` already at 0. An idle check
 * armed during the same window (a pending `sleep()` arms one on every replay)
 * could then observe "idle" mid-deferral and raise a `WorkflowSuspension`
 * BEFORE the workflow's own continuations ran: a suspension carrying none of
 * the follow-up work the batch was about to create, which the runtime
 * dutifully schedules as nothing, leaving the run dormant until an unrelated
 * timer fires (vercel/workflow#3183).
 *
 * Deliveries that do NOT resolve on their own must be excluded, not for
 * accuracy but for termination: an unclaimed buffered hook payload is retired
 * BY the idle safety net in {@link registerDeliveryBarrier}, so counting it
 * here would gate its own retirement. That reasoning extends to whatever is
 * parked behind such a payload (a wait, and a step gating on that wait) for
 * the same reason: the whole chain moves only once the net fires, and it
 * cannot fire while the chain is counted. Self-resolving deliveries always
 * deliver from their own chains (see the INVARIANT on
 * {@link registerDeliveryBarrier}) and never need that net, so waiting on
 * them is deadlock-free.
 */
export declare function hasParkedCommittedDelivery(ctx: WorkflowOrchestratorContext): boolean;
/**
 * Whether no data delivery (step result, hook payload) is in flight right now.
 *
 * "In flight" is two distinct windows, each with its own guard:
 * `pendingDeliveries > 0` covers hydration inside the serial queue slots, and
 * {@link hasParkedCommittedDelivery} covers the detached gap between a slot
 * releasing that counter and the delivery's `resolve()` actually running,
 * deliberately outside `pendingDeliveries` (see step.ts), and invisible to it.
 *
 * Anything that decides a replay is over, or that a replay went wrong, has to
 * consult this first: while it is false the workflow VM is mid-reaction, so
 * what it has and has not done yet says nothing about the run. Two callers
 * read it, for the two such decisions: {@link scheduleWhenIdle} for the
 * suspension, and the events consumer's unconsumed-event check for divergence.
 *
 * A non-empty barrier registry counts as in flight, even when every remaining
 * entry is parked behind an unclaimed buffered payload. Those entries only
 * move when the safety-net dispenser retires them (lowest-first, see
 * {@link ensureBarrierSafetyNet}), and the deliveries they release are real
 * workflow reactions: a suspension raised before they run would be computed
 * from a VM that has not seen them, scheduling none of their follow-up work
 * and leaving the run dormant (the vercel/workflow#3183 shape). The dispenser
 * itself is gated on {@link canRetireAbandonedBarriers}, the weaker predicate
 * without the registry term, precisely so it can do the draining that this
 * predicate waits for; registry size strictly decreases at each retirement,
 * so idle is always reached.
 */
export declare function isDeliveryIdle(ctx: WorkflowOrchestratorContext): boolean;
/**
 * Schedule a callback to fire only after all pending data deliveries
 * (step results, hook payloads) and async deserialization have completed.
 * Uses a polling loop: setTimeout(0) → check pendingDeliveries and the
 * barrier registry → if anything is still in flight, wait for promiseQueue →
 * repeat. This handles the multi-round delivery pattern where each hook
 * payload delivery cycle appends new async work to the promiseQueue. What
 * counts as in flight is {@link isDeliveryIdle}.
 *
 * The initial `setTimeout(0)` macrotask is load-bearing and must NOT be
 * downgraded to a microtask (`queueMicrotask`/`Promise.resolve().then`).
 * `pendingDeliveries` only guards the host-side hydration window; between a
 * delivery's `resolve()` and the workflow VM body running its continuation to
 * register the next subscriber, `pendingDeliveries` is already 0 even though
 * the VM is mid-reaction. Node does not guarantee a microtask scheduled in
 * the host context settles after the cross-VM promise chain (resolve in host
 * → workflow code in VM → subscribe back in host); the macrotask boundary
 * gives that chain time to run, so the suspension does not preempt a sibling
 * delivery still in flight. Empirically, replacing it with `queueMicrotask`
 * breaks hook/sleep `Promise.race` ordering (CorruptedEventLogError).
 */
export declare function scheduleWhenIdle(ctx: WorkflowOrchestratorContext, fn: () => void, 
/**
 * Checked before every poll: once it returns true the poll ends without
 * calling `fn`, instead of polling on until idle only to drop the call.
 */
isStale?: () => boolean): void;
/**
 * Schedule a generation-guarded suspension after deliveries settle.
 *
 * At most one idle poll runs per generation: a signal raised while that
 * generation's poll runs joins it, and the poll ends as soon as the
 * generation moves on. The poll that runs is the earliest one of its
 * generation, so the suspension is raised no earlier than the first of N
 * independent polls would have raised it. Before this, each pending consumer
 * at the end of the log started its own poll, and polls of past generations
 * kept polling until idle: a lingering orchestrator resuming a 1024-wide
 * fan-out once per incoming outcome ran about 10^8 timers, which kept the
 * process busy for over a minute after the last outcome arrived.
 */
export declare function scheduleWorkflowSuspension(ctx: WorkflowOrchestratorContext): void;
export {};
//# sourceMappingURL=private.d.ts.map