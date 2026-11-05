import type { SessionStreamEvent } from "#protocol/session-event.js";
import { ClientAgentSession } from "#client/agent-session.js";
import { type Delivery } from "#client/delivery.js";
import type { PrewarmSessionResult } from "#protocol/prewarm-session.js";
import type { Answer } from "#shared/input.js";
import type { ClientSessionState, ClientRedirectPolicy, RespondTurnOptions, SendTurnInput, SendTurnOptions, SessionSnapshot, SessionStreamOptions } from "#client/types.js";
declare const followSession: unique symbol;
interface FollowSessionOptions extends SessionStreamOptions {
    readonly headers?: Readonly<Record<string, string>>;
    readonly onCaughtUp?: () => void;
    readonly resolveReconnectPolicy?: () => SessionStreamOptions["reconnect"];
    readonly resolveHeaders?: () => Readonly<Record<string, string>> | undefined;
}
/**
 * Internal interface that a {@link ClientSession} uses to access client-level
 * configuration without depending on the full {@link Client} class.
 */
export interface ClientSessionContext {
    readonly baseUrl: string;
    readonly redirect?: ClientRedirectPolicy;
    resolveHeaders(perRequest?: Readonly<Record<string, string>>): Promise<Headers>;
}
/** One fixed, ID-addressed conversation with an eve agent. */
export declare class ClientSession {
    #private;
    /** Built by the eve client, which supplies the session's transport context. */
    constructor(context: ClientSessionContext, state: ClientSessionState);
    /** The fixed session ID; reading it performs no I/O. */
    get id(): string;
    /** Current fixed session identity and durable stream cursor. */
    get state(): ClientSessionState;
    /** Reads a finite prefix through the durable tail without advancing this handle. */
    snapshot(options?: {
        readonly signal?: AbortSignal;
    }): Promise<SessionSnapshot>;
    /** Sends a message to this exact session ID. */
    send<TOutput = unknown>(message: SendTurnInput<TOutput>["message"], options?: SendTurnOptions<TOutput>): Promise<Delivery<TOutput>>;
    /** Answers pending input requests on this exact session ID. */
    respond<TOutput = unknown>(answers: readonly Answer[], options?: RespondTurnOptions<TOutput>): Promise<Delivery<TOutput>>;
    /** Requests preparation of an existing idle session; never starts a model turn. */
    prewarm(options?: {
        readonly signal?: AbortSignal;
    }): Promise<PrewarmSessionResult>;
    /** Requests cooperative cancellation of this session's active turn. */
    cancel(options?: {
        readonly signal?: AbortSignal;
        readonly turnId?: string | null;
    }): Promise<Delivery>;
    /** Cancels a running turn and every working task, then removes this session's model history. */
    clear(options?: {
        readonly signal?: AbortSignal;
    }): Promise<Delivery>;
    /** Queues context compaction without sending model input. */
    compact(options?: {
        readonly signal?: AbortSignal;
    }): Promise<Delivery>;
    /** Terminally retires this exact session ID. The handle remains pinned to it. */
    end(options?: {
        readonly reason?: string;
        readonly signal?: AbortSignal;
    }): Promise<Delivery>;
    /** Opens this session's durable event stream from its stored cursor. */
    stream(options?: SessionStreamOptions): AsyncIterable<SessionStreamEvent>;
    /**
     * The session an agent run opened, as this session's stream linked it.
     * Pass a `child.opened` event from this session, then follow the child
     * with `stream()`; reads use this session's base URL and credentials, for local
     * and remote agents alike.
     */
    agent(opened: Extract<SessionStreamEvent, {
        type: "child.opened";
    }>): ClientAgentSession;
    [followSession](options: FollowSessionOptions): AsyncIterable<SessionStreamEvent>;
}
export {};
