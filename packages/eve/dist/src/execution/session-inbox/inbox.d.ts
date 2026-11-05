import type { SessionPrewarmPayload } from "#execution/session-prewarm.js";
import type { DeliverPayload, HookPayload, SessionCommand } from "#channel/types.js";
import type { WorkflowToolRunMessage } from "#execution/tools/workflow/messages.js";
/** All session addresses accept the same protocol. Callback routes construct
 * their own message kind; they never accept arbitrary session commands. */
export interface AuthorizationCallbackPayload {
    readonly kind: "authorization-callback";
    readonly payloads: DeliverPayload[];
}
/** The runtime sends this command; channel request bodies cannot supply it. */
export interface SessionFailurePayload {
    readonly kind: "session-failure";
    readonly error: string;
}
/**
 * One part of the previous owner's accepted-but-unread payloads after a
 * handoff. The runtime sends these commands; channel request bodies cannot
 * supply them.
 */
export interface SessionHandoverPayload {
    readonly kind: "handover";
    /** The handoff attempt this answers; see {@link SessionHookBatchClaimOptions.handover}. */
    readonly attemptKey: string;
    /** Parts apply in index order; a retried send repeats its index. */
    readonly index: number;
    /** The last part; reads resume once every part before it has been applied. */
    readonly final?: true;
    readonly payloads: readonly Exclude<SessionInboxPayload, SessionHandoverPayload>[];
}
/** Replay-stable evidence that every buffered part and the final marker were applied. */
export interface SessionHandoverObservation {
    readonly attemptKey: string;
    readonly payloadCount: number;
    /** Workflow event time, not the host wall clock when replay reached this point. */
    readonly appliedAtMs: number;
}
export type SessionInboxPayload = SessionPrewarmPayload | SessionFailurePayload | SessionHandoverPayload | HookPayload | SessionCommand | WorkflowToolRunMessage | AuthorizationCallbackPayload;
/**
 * While a handover is awaited (see {@link SessionHookBatchClaimOptions.handover}),
 * reads expose nothing; interrupt handlers still fire on arrival.
 */
export interface SessionInboxReader {
    readonly handoverObservation?: SessionHandoverObservation;
    /**
     * Waits for and removes the next accepted payload in arrival order, or
     * `undefined` once no hook can deliver any more (released or taken over).
     * Only one consumer waits at a time; the owner program is strictly sequential.
     */
    next(): Promise<SessionInboxPayload | undefined>;
    /** Removes every payload accepted so far, in arrival order. */
    drain(): SessionInboxPayload[];
    /** Removes the payloads at the front of the queue that `accepts` takes, stopping at the first it doesn't. */
    takeLeading<T extends SessionInboxPayload>(accepts: (payload: SessionInboxPayload) => payload is T): T[];
    hasPending(): boolean;
    /** Resolves once a payload is ready or the inbox closes, without consuming anything. */
    whenPending(): Promise<void>;
    /**
     * Called from the pump the moment an interrupt (`cancel`, `clear`,
     * `reset`, `session-timeout`) is accepted, ahead of any consumer read. Handlers must
     * be synchronous and idempotent. The payload stays in the queue so the
     * consumer still processes it in order.
     */
    onInterrupt(handler: (payload: SessionInboxPayload) => void): () => void;
    /**
     * Observes readable deliveries without consuming them; replays unread
     * deliveries on subscription and when a handover arrives, so handlers must
     * be idempotent.
     */
    onDelivery(handler: (payload: SessionInboxPayload) => void): () => void;
    /** Requeues payloads a successor handed back, ahead of everything pumped since. */
    restore(payloads: readonly SessionInboxPayload[]): void;
}
export interface SessionHookClaimOptions {
    /**
     * Take the address over from the run that holds it instead of conflicting.
     * Still rejects with `HookConflictError` when the holder's runtime cannot be
     * taken from; throws `FatalError` when the World does not support it. A
     * token this inbox already holds is claimed again on a fresh hook.
     */
    readonly force?: boolean;
    /**
     * Creates the hook at once but confirms its registration only after this
     * settles. While a registration is awaited, Workflow queues every step
     * started beside it instead of running it inline, so a claim made next to a
     * step confirms after that step; the hook still commits alongside it.
     */
    readonly confirmAfter?: Promise<unknown>;
}
export interface SessionHookBatchClaimOptions extends SessionHookClaimOptions {
    /**
     * Expect a `handover` for this attempt key. Before any hook is created,
     * reads stop exposing anything; as its parts arrive on any hook, their
     * payloads take their place after what was queued at this call and ahead of
     * everything accepted since. Reads resume after the final part.
     */
    readonly handover?: string;
}
export interface SessionInboxOwnership {
    /** Logical tokens currently claimed, in claim order. */
    readonly claimedTokens: readonly string[];
    claimSessionHook(token: string, options?: SessionHookClaimOptions): Promise<void>;
    /** Registers every token as one batch; all claims settle before the first failure propagates. */
    claimSessionHooks(tokens: readonly string[], options?: SessionHookBatchClaimOptions): Promise<void>;
}
export interface SessionInbox extends SessionInboxReader, SessionInboxOwnership {
}
export interface SessionInboxHandle extends SessionInbox {
    /** A handover is expected and has not arrived; the session must not move again until it does. */
    readonly awaitingHandover: boolean;
    /** Resolves once no handover is awaited: it arrived, was abandoned, or the inbox closed. */
    whenHandoverSettled(): Promise<void>;
    /** Stops waiting for `attemptKey`'s handover, which can no longer arrive; queued payloads become readable. */
    abandonHandover(attemptKey: string): void;
    /** Resolves the first time a read waits on an awaited handover. */
    whenBlockedOnHandover(): Promise<void>;
    /** Resolves when the next payload arrives on any hook, readable or not. */
    whenArrival(): Promise<void>;
    /** Another run force-claimed every hook this inbox held. */
    readonly takenOver: boolean;
    /**
     * Resolves once another run has force-claimed every hook this inbox held.
     * Every payload delivered before the takeover is queued by then. Rejects if
     * a reader fails, if the inbox is released or disposed first, or once
     * `signal` aborts.
     */
    whenTakenOver(signal?: AbortSignal): Promise<void>;
    dispose(): Promise<void>;
    /** Disposes every hook and returns each payload the hooks accepted but the owner never read. */
    release(): Promise<SessionInboxPayload[]>;
}
export declare function isInterrupt(value: SessionInboxPayload): boolean;
/**
 * One FIFO queue for the session lifetime, fed by a continuous reader per
 * claimed hook. The pump never waits on queue depth: interrupts share each
 * hook's ordered stream, so any backpressure on ordinary payloads would also
 * hold back the cancel behind them. Accepted payloads are already durable on
 * the hook, so the queue is a mirror rather than the source of truth.
 */
export declare function createSessionInbox(sessionId: string): SessionInboxHandle;
export declare function isWorkflowMessage(value: SessionInboxPayload): value is WorkflowToolRunMessage;
