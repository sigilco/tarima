import type { WorkflowInvokePayload } from '#compiled/@workflow/world/index.js';
type WaitContinuation = NonNullable<WorkflowInvokePayload['waitContinuation']>;
/**
 * The deadline (epoch ms) of the timer hop a sender at `nowMs` sends for a
 * wait due at `resumeAtMs`.
 *
 * A wait longer than one queue delay (`getWaitContinuationMaxDelaySeconds`)
 * is reached in hops, and the hops are anchored on the wait's deadline: the
 * last one is due at `resumeAtMs`, and each one before it one maximum delay
 * earlier. A sender sends the earliest hop that is still ahead of it, so
 * every sender within the same hop window computes the same deadline, and
 * with it the same idempotency key ({@link waitTimerMessage}): the timers
 * that the creating delivery, its redelivery, a delivery completing an
 * earlier wait of the chain and a hop's own redelivery send for one hop are
 * one message.
 *
 * `afterHopAtMs` is the deadline of the intermediate hop being delivered,
 * when the sender is one: the next hop then comes after it whatever the
 * sender's clock says, so a hop delivered a little early (the queue's clock
 * ahead of the host's) does not compute its own deadline again, whose key it
 * has spent.
 */
export declare function waitTimerHopAtMs(params: {
    resumeAtMs: number;
    nowMs: number;
    afterHopAtMs?: number;
}): number;
/**
 * The timer message of a spec 9 wait, and its idempotency key.
 *
 * A wait longer than one queue delay is reached in hops
 * ({@link waitTimerHopAtMs}). Every hop but the last is an intermediate hop:
 * it carries the wait's deadline (`waitContinuation.resumeAtMs`), which
 * tells the World not to serialize or coalesce it (`isIntermediateWaitHop`
 * in `@workflow/world`), and its own (`waitContinuation.hopAtMs`), and its
 * delivery only sends the next hop (see `continueWaitHop` in `delivery.ts`).
 * The last hop, due with the wait, carries neither and is an ordinary
 * orchestrator message: if the queue coalesces it into a running delivery
 * of the run, that delivery's re-run finds the wait due and completes it.
 *
 * Every hop is keyed `wait:<correlationId>:<resumeAtMs>:<hopAtMs>`: the
 * wait, its deadline (a correlation id can be given a new deadline by a
 * replay after a creation that did not commit) and the hop's deadline. So
 * the timers every sender sends for one hop of one wait are deduplicated
 * by the queue instead of starting parallel hop chains.
 *
 * `attempt` counts the re-arms of a wait whose last timer was delivered
 * before the wait was due (clock skew between the queue and the host): that
 * delivery has spent the key of the hop due at `resumeAtMs`, so its re-arm
 * carries `:a<attempt>` (one more than the delivered timer's), and so does
 * every hop after it. A redelivery of the early timer computes the same
 * re-arm key. The near-due safety net keys its re-arms by the sender's
 * second instead ({@link nearDueTimerIdempotencyKey}).
 */
export declare function waitTimerMessage(params: {
    correlationId: string;
    resumeAtMs: number;
    /** Seconds until the wait is due, as the caller rounds them: the last hop's delay. */
    seconds: number;
    nowMs: number;
    attempt?: number;
    /** The deadline of the intermediate hop being delivered, on its delivery. */
    afterHopAtMs?: number;
}): {
    waitContinuation: WaitContinuation;
    delaySeconds: number;
    hopAtMs: number;
    idempotencyKey: string;
};
/**
 * The idempotency key of one hop of a wait's timer (see
 * {@link waitTimerMessage}).
 */
export declare function waitTimerIdempotencyKey(params: {
    correlationId: string;
    resumeAtMs: number;
    hopAtMs: number;
    attempt?: number;
}): string;
/**
 * Whether a timer a delivery sends takes the near-due re-arm's key
 * ({@link nearDueTimerIdempotencyKey}) instead of its hop's: a wait's last
 * hop, sent by a delivery that may hold a timer the queue coalesced into it
 * (any delivery but its message's first), other than a timer delivery's
 * re-arm of its own wait (which carries the next attempt).
 *
 * The queue can coalesce a wait's last hop that came due before its wait
 * (clock skew, or a World that clamps the delay below a hop) into a
 * delivery that owns the wait's chain. That delivery finds the wait not yet
 * due and arms it again, while the queue still holds the coalesced hop's key,
 * which it never delivered: under that key the re-arm would be dropped and
 * the wait left with no timer. Intermediate hops are never coalesced
 * (`isIntermediateWaitHop` in `@workflow/world`), so they keep their key
 * from every sender, and a long wait's hops never form parallel chains.
 */
export declare function rearmsCoalescableTimer(params: {
    mayHoldCoalescedTimer: boolean;
    intermediate: boolean;
    attempt: number;
}): boolean;
/**
 * The idempotency key of a near-due re-arm: the timer a suspending delivery
 * that may hold a coalesced timer sends for an open wait due within the
 * near-due window, whatever chain the wait is in (`armNearDueTimers` in
 * `delivery.ts`, and the QuickJS engine's exit sweep).
 *
 * Without a key every such delivery sent one timer for every near-due wait,
 * and nothing deduplicated them: a fan-out whose waits came due one
 * delivery at a time sent a timer per wait per delivery. The key collapses
 * the re-arms of one wait, for one `resumeAt`, sent within the same second
 * of the sender's clock, into one message on every World (world-vercel
 * keeps a key for a day, world-local while its message lives, world-postgres
 * while its job exists).
 *
 * It has the shape of a hop's key ({@link waitTimerIdempotencyKey}) with the
 * sender's second, `s<second>`, in place of the hop's deadline. The second
 * is in it so that a re-arm can itself be re-armed: a re-arm reaches the
 * queue with a delay of at least a second, so the delivery it may be
 * coalesced into early, a little before its wait is due, sends its own
 * re-arm in a later second, under a fresh key. The hop's deadline would not
 * do: a near-due re-arm stands in for the wait's last hop, which the queue
 * coalesced into a delivery and never delivered, and whose key it still
 * holds, so a re-arm under that key would be dropped.
 */
export declare function nearDueTimerIdempotencyKey(params: {
    correlationId: string;
    resumeAtMs: number;
    nowMs: number;
}): string;
/** How many near-due re-arm keys {@link sendNearDueTimerOnce} remembers. */
export declare const SENT_NEAR_DUE_TIMER_KEYS_LIMIT = 10000;
/**
 * Sends a near-due re-arm (`send`) unless this process already sent one
 * under `key` ({@link nearDueTimerIdempotencyKey}), and says whether it
 * sent. Every coalesced re-run of a busy run's delivery arms every near-due
 * wait, and the queue would drop each repeat by its key anyway: this skips
 * the send itself, which a suspending delivery otherwise makes once per
 * near-due wait. A failed send is forgotten, so a later delivery retries it.
 * Bounded to the {@link SENT_NEAR_DUE_TIMER_KEYS_LIMIT} newest keys.
 */
export declare function sendNearDueTimerOnce(key: string, send: () => Promise<void>): Promise<boolean>;
export {};
//# sourceMappingURL=wait-timer.d.ts.map