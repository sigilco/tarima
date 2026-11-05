import type { SessionStoreCallbacks, SessionStoreInit, SessionStoreSnapshot } from "#client/session-store-state.js";
import { type Delivery } from "#client/delivery.js";
import type { DeliveryReceipt } from "#protocol/delivery.js";
import type { SendTurnPayload } from "#client/types.js";
export type { SessionStoreCallbacks, SessionStoreInit, SessionStoreSnapshot, SessionStoreStatus, PrepareSend, } from "#client/session-store-state.js";
declare const detachStore: unique symbol;
declare const attachStore: unique symbol;
/** An observable durable session. Commands resolve on acceptance; only its stream changes its lifecycle. */
export declare class SessionStore {
    #private;
    constructor(init: SessionStoreInit);
    get snapshot(): SessionStoreSnapshot;
    /** Activates observation outside a framework. Release the scope to stop reads, not execution. */
    observe(): () => void;
    setCallbacks(callbacks: SessionStoreCallbacks): void;
    subscribe(callback: () => void): () => void;
    /**
     * Creates an idle session, sharing creation with sends already in flight, or
     * prepares an existing session's idle owner without a model turn.
     */
    prewarm(): Promise<void>;
    /** Accepts a message or answers. Observe the stream for its durable result. */
    send<TOutput = unknown>(input: SendTurnPayload<TOutput>): Promise<Delivery<TOutput>>;
    /**
     * Follow an accepted delivery in this session until it settles or the session ends.
     * The receipt may come from another store. Repeating it is safe and retries a closed stream.
     * Pass only a receipt returned by `send`, `respond`, `clear`, `compact`, or `end`: a receipt
     * may arrive before its delivery is admitted, so an id the stream never admits keeps the store
     * busy and its stream open until the session ends or `newSession()`.
     * Catch-up updates recorded failures without replaying live completion callbacks.
     * Normal session stream authorization still applies.
     */
    follow(receipt: DeliveryReceipt): void;
    /** Replays through the durable tail; subsequent following obeys `followWhile`. */
    resume(): Promise<void>;
    /** Cancels the current turn, waiting for a pending submission's turn when necessary. */
    cancel(): Promise<Delivery>;
    compact(): Promise<Delivery>;
    clear(): Promise<Delivery>;
    end(): Promise<Delivery>;
    [attachStore](): void;
    [detachStore](): void;
    newSession(): void;
}
