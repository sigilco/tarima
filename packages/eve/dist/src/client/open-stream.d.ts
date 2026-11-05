import type { SessionStreamEvent } from "#protocol/session-event.js";
import type { StoredLine } from "#protocol/session-events/envelope.js";
import type { ClientRedirectPolicy, ReconnectOptions } from "#client/types.js";
interface ResolvedStreamReconnectPolicy {
    /** False when the caller owns cursor recovery: one connection, then stop. */
    readonly reconnect: boolean;
    readonly retryableStatuses: ReadonlySet<number>;
    readonly baseDelayMs: number;
    readonly maxAttempts: number;
    readonly maxDelayMs: number;
}
/** Backoff between reconnects after a transport failure. Following readers retry forever. */
export declare const RECONNECT_BACKOFF: {
    readonly baseDelayMs: 250;
    readonly maxDelayMs: 5000;
};
export declare const DEFAULT_STREAM_RECONNECT_POLICY: ResolvedStreamReconnectPolicy;
export declare function isRetryableStreamError(error: unknown, statuses?: ReadonlySet<number>): boolean;
/**
 * Internal configuration for following a durable event stream.
 */
interface FollowStreamInput {
    /** Validates reader provenance before consuming any stream data. */
    readonly onOpen?: (headers: Headers) => void;
    /** Committed source progress, including lines that materialize no recognized events. */
    readonly onPosition?: (position: number) => void;
    /** Called once after consuming the durable tail captured when the connection opens. */
    readonly onCaughtUp?: () => void;
    readonly baseUrl: string;
    readonly resolveReconnectPolicy?: () => false | ReconnectOptions | undefined;
    readonly reconnect?: false | ReconnectOptions;
    readonly resolveHeaders: () => Promise<Headers>;
    readonly redirect?: ClientRedirectPolicy;
    /** eve stream route path, such as a session stream or a parent-origin subagent stream. */
    readonly path: string;
    readonly searchParams?: Readonly<Record<string, string>>;
    readonly signal?: AbortSignal;
    /** The position of the first line to read. Negative values count back from the tail. */
    readonly startIndex: number;
    /** Follow the live stream after the durable tail (default). `false` bounds the read at the tail. */
    readonly follow?: boolean;
}
/** One connection open; `requestTailIndex` asks the server to report the durable tail index. */
interface OpenStreamInput extends FollowStreamInput {
    readonly requestTailIndex?: boolean;
}
/** One stored line and its position. A line this version can't read has `line: undefined`. */
export interface FollowedLine {
    readonly line: StoredLine | undefined;
    readonly position: number;
}
/**
 * Follows one durable stream route from a position, reconnecting as the transport ends.
 *
 * A reader counts positions from its cursor, one per stored line, and jumps forward at each
 * position marker. `stream.ended` stops the follow; a lease end reconnects at once; anything
 * else is a transport failure, retried with capped backoff. Readers that follow retry forever,
 * and decide to stop from what they read. A tail-relative cursor becomes a position on the first
 * connection, from the tail the server reports.
 *
 * With `follow: false`, the first connection fixes the bound: the iterator yields lines until
 * the cursor passes that tail, reconnecting as needed, then returns instead of following.
 */
export declare function followStreamLines(input: FollowStreamInput): AsyncGenerator<FollowedLine>;
/** One v26 event read from a line, with the position to resume from once it's handled. */
export interface FollowedEvent {
    readonly event: SessionStreamEvent;
    /**
     * The cursor after this event: past its line once the line's last event is handled, at the
     * line before then, so a resume re-reads the rest of the line.
     */
    readonly cursor: number;
}
/**
 * Follows a stream route's v26 events: the records each line carries, rebuilt as v26 readers
 * expect them. Kept while v26 event types ride inside lines.
 */
export declare function followStreamIterable(input: FollowStreamInput): AsyncGenerator<FollowedEvent>;
/** An opened connection: the response body plus the tail index from the response header, if any. */
interface OpenedStream {
    readonly headers: Headers;
    readonly body: ReadableStream<Uint8Array>;
    close(): void;
    readonly tailIndex: number | undefined;
}
/**
 * Opens one stream response body, retrying transient failures with capped
 * exponential backoff (~35s total): brief network outages and the short
 * propagation window where a just-acknowledged session may not yet be
 * readable from the stream route.
 */
export declare function openStreamBody(input: OpenStreamInput & {
    readonly retryPolicy?: ResolvedStreamReconnectPolicy;
}): Promise<OpenedStream>;
export declare function sleep(ms: number, signal?: AbortSignal): Promise<void>;
export {};
