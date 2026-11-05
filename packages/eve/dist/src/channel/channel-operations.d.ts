import type { MessageContent } from "#shared/message-content.js";
import type { Delivery } from "#shared/delivery.js";
import type { ChannelAdapter } from "#channel/adapter.js";
import type { ChannelDeliverySource } from "#channel/delivery-metadata.js";
import { type ChannelCreateResult } from "#channel/channel-address.js";
export type { ChannelCreateResult } from "#channel/channel-address.js";
import type { SessionSendOptions, Session } from "#channel/session.js";
import type { Runtime, SessionAuthContext, TurnPolicy, SessionControlOptions } from "#channel/types.js";
import { type Answer, type StrictAnswers } from "#shared/input.js";
import type { JsonObject } from "#shared/json.js";
import type { SessionHistoryMessage } from "#shared/session-history.js";
/** Options for sending a message from a channel-local continuation address. */
export type ChannelSendOptions<TState = undefined> = SessionSendOptions & {
    readonly state?: Partial<TState>;
};
interface BaseChannelRespondOptions<TState = undefined> {
    /** Stable delivery identity, with the same scope and retention as `send()`. */
    readonly idempotencyKey?: string;
    readonly auth: SessionAuthContext | null;
    readonly outputSchema?: JsonObject;
    readonly context?: readonly string[];
    readonly state?: Partial<TState>;
}
/** Options for answering pending input requests at an existing continuation address. */
export type ChannelRespondOptions<TState = undefined> = BaseChannelRespondOptions<TState>;
/** Options for creating a session at a channel-local address without running a turn. */
export type ChannelCreateOptions<TState = undefined> = {
    readonly auth: SessionAuthContext | null;
    /** Prior conversation the session starts with; it joins history with the first message. */
    readonly history?: readonly SessionHistoryMessage[];
    readonly initiatorAuth?: SessionAuthContext | null;
    readonly title?: string;
} & ([TState] extends [undefined] ? unknown : {
    readonly state: TState;
});
/** Dynamic handle for whichever session currently owns one channel-local address. */
export interface ChannelSource<TState = undefined> {
    /**
     * Creates a session that waits for its first message, without running a
     * turn. When another session owns the address, or claims it concurrently,
     * returns that session unchanged with `created: false`; its `history` was not
     * added. Throws `SessionStrandedError` when the owner is stranded; end the session at the
     * address, then create again.
     */
    create(options: ChannelCreateOptions<TState>): Promise<ChannelCreateResult>;
    /** Starts or resumes a turn with a user message. May create a session. */
    send(message: MessageContent, options: ChannelSendOptions<TState>): Promise<Delivery>;
    /** Answers pending input requests. Never creates a session. */
    respond<const TResponses extends readonly Answer[]>(answers: StrictAnswers<TResponses>, options: ChannelRespondOptions<TState>): Promise<Delivery>;
    /** Cooperatively cancels the active turn without creating a session. */
    cancel(options?: {
        readonly turnId?: string | null;
    } & SessionControlOptions): Promise<Delivery>;
    /** Queues context compaction without creating a session. */
    compact(options?: SessionControlOptions): Promise<Delivery>;
    /** Cancels a running turn and every working task, then clears model-message history in place. */
    clear(options?: SessionControlOptions): Promise<Delivery>;
    /** Retires the current owner without creating a replacement. */
    end(options?: {
        readonly reason?: string;
    } & SessionControlOptions): Promise<Delivery>;
}
/** Binds a raw channel-local continuation address to its current-owner operations. */
export type ChannelFrom<TState = undefined> = (address: string) => ChannelSource<TState>;
/** Snapshots the session currently owning a channel-local continuation address. */
export type ChannelResolveSession = (address: string) => Promise<Session | undefined>;
/** Continuation operations passed to an authored channel's proactive `receive` hook. */
export interface ChannelReceiveContext<TState = undefined> {
    readonly from: ChannelFrom<TState>;
    readonly resolveSession: ChannelResolveSession;
}
/** Creates request-scoped channel operations backed by continuation dispatch. */
export declare function createChannelOperations<TState = undefined>(input: {
    readonly adapter: ChannelAdapter<any>;
    readonly channelName: string;
    readonly metadata?: ChannelDeliverySource;
    readonly runtime: Runtime;
    readonly turnPolicy?: TurnPolicy;
}): ChannelReceiveContext<TState>;
