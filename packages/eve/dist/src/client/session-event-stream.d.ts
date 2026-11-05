import type { SessionStreamEvent } from "#protocol/session-event.js";
import { type ClientSession } from "#client/session.js";
import type { SessionStreamOptions } from "#client/types.js";
export interface SessionEventStreamOptions {
    readonly startIndex?: number;
    readonly headers?: Readonly<Record<string, string>>;
    readonly reconnect?: SessionStreamOptions["reconnect"];
    readonly onEvent: (event: SessionStreamEvent, historical: boolean) => void;
    readonly onError: (error: unknown) => void;
}
/** One continuously folded UI transport, independent of explicit Delivery reads. */
export declare class SessionEventStream {
    #private;
    readonly caughtUp: Promise<void>;
    constructor(session: ClientSession, options: SessionEventStreamOptions);
    get ended(): boolean;
    setOptions(options: Pick<SessionEventStreamOptions, "headers" | "reconnect">): void;
    close(): void;
}
