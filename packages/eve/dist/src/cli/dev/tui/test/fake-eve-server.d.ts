import type { SessionEvent } from "#protocol/session-event.js";
export interface FakeEveRequest {
    readonly method: string;
    readonly path: string;
    readonly sessionId?: string;
    readonly body?: Record<string, unknown>;
}
/** Events a fake agent streams after it accepts one delivery. */
export type FakeEveTurn = (request: FakeEveRequest & {
    readonly deliveryId: string;
    readonly turnId: string;
}) => readonly SessionEvent[];
/**
 * An in-memory eve HTTP server for driving real clients through `fetch`.
 * Sessions keep a durable event log; streams replay from their cursor and then
 * follow live emissions, so reconnects and late subscribers behave like eve.
 */
export declare class FakeEveServer {
    #private;
    readonly requests: FakeEveRequest[];
    /** `fallback` serves routes outside the session API, such as dev runtime artifacts. */
    constructor(respond?: FakeEveTurn, fallback?: typeof fetch);
    get sessionId(): string | undefined;
    /** Requests to one route, such as `POST /cancel`. */
    requestsTo(method: string, suffix: string): FakeEveRequest[];
    /** Appends events to a session's durable stream; the current session by default. */
    emit(events: readonly SessionEvent[], _deliveryId?: string, sessionId?: string | undefined): void;
    readonly fetch: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
    close(): void;
}
/** A fake agent that answers every message with the same completed reply. */
export declare function reply(text: string): FakeEveTurn;
/** A fake agent that accepts deliveries and leaves their events to the test. */
export declare function silent(): FakeEveTurn;
