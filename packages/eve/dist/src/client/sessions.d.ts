import { ClientSession, type ClientSessionContext } from "#client/session.js";
import type { Delivery } from "#client/delivery.js";
import type { ClientSessionState, CreateSessionOptions, SendTurnInput } from "#client/types.js";
/** Result of explicitly creating an ID-addressed client session. */
export interface CreatedClientSession<TOutput = unknown> {
    readonly delivery: Delivery<TOutput>;
    readonly session: ClientSession;
}
/** Result of creating a session before its first turn. */
export interface CreatedIdleClientSession {
    readonly session: ClientSession;
}
/** Collection surface for explicitly creating or attaching ID-addressed sessions. */
export declare class ClientSessions {
    #private;
    /** Built by the eve client, which supplies its transport context. */
    constructor(context: ClientSessionContext);
    /** Creates a session and starts its first turn with a message. */
    create<TOutput = unknown>(input: SendTurnInput<TOutput> & CreateSessionOptions): Promise<CreatedClientSession<TOutput>>;
    /** Creates a conversation session before its first turn. */
    create(options?: CreateSessionOptions): Promise<CreatedIdleClientSession>;
    /** Attaches a fixed handle to a known session ID without performing I/O. */
    attach(sessionId: string, options?: Partial<Pick<ClientSessionState, "inbox" | "streamIndex">>): ClientSession;
}
