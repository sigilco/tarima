import type { SessionStreamEvent } from "#protocol/session-event.js";
import { type StoredLine } from "#protocol/session-events/envelope.js";
/** Options for {@link streamSessionEvents}. */
export interface SessionEventStreamOptions {
    /**
     * Position of the first line to read. Negative values count back from the
     * durable tail (`-1` is the latest line). Defaults to `0`.
     */
    readonly startIndex?: number;
    /**
     * Whether to keep following lines recorded after the read opens. When
     * `false`, the read ends at the durable tail observed when it opens.
     * Defaults to `true`.
     */
    readonly follow?: boolean;
    /** Stops the read and releases the underlying stream reader. */
    readonly signal?: AbortSignal;
}
/** One stored line and its position. A line this version can't read has `line: undefined`. */
export interface PositionedLine {
    readonly position: number;
    readonly line: StoredLine | undefined;
    /** The line as stored, parsed. */
    readonly record: unknown;
}
/**
 * Reads one session's stored records from `startIndex`, one per line, as parsed JSON. Negative
 * `startIndex` values count back from the tail. Callers count positions: one per record.
 */
export declare function readSessionRecords(sessionId: string, startIndex?: number): ReadableStream<unknown>;
/**
 * Reads one session's events, following new lines as they're written. Records of types this
 * version doesn't know, including a pre-v27 session's, are skipped.
 */
export declare function readSessionEventStream(sessionId: string, startIndex?: number, signal?: AbortSignal): ReadableStream<SessionStreamEvent>;
/**
 * Reads one session's recorded events up to the durable tail observed when
 * the read opens, then ends. Negative `startIndex` values count back from
 * that tail.
 */
export declare function readSessionEventHistory(sessionId: string, startIndex?: number, signal?: AbortSignal): ReadableStream<SessionStreamEvent>;
/**
 * Reads one session's stored records up to the durable tail observed when the read opens, then
 * ends. Negative `startIndex` values count back from that tail.
 */
export declare function readSessionRecordHistory(sessionId: string, startIndex?: number): ReadableStream<unknown>;
/** Returns the position of the last durably recorded line, or `-1` before the first. */
export declare function readSessionStreamTailIndex(sessionId: string): Promise<number>;
/**
 * Throws when the session's run does not exist or its recorded history has
 * passed retention. Cheaper than {@link readSessionStreamTailIndex}, whose
 * lookup on the local world opens every chunk file.
 */
export declare function assertSessionHistoryReadable(sessionId: string): Promise<void>;
/**
 * Iterates one session's stored lines in process, without the HTTP stream route, with each
 * line's position. A bounded read stops at the tail it observed when it opened: the writer
 * stores one chunk per line, so positions are chunk indexes.
 */
export declare function streamSessionLines(sessionId: string, options?: SessionEventStreamOptions): AsyncGenerator<PositionedLine, void, undefined>;
/**
 * Iterates one session's events in process, from the lines {@link streamSessionLines} reads.
 * A session an eve before v27 recorded reads as the v27 commits its v26 lines record; see
 * `#execution/v26-history.js`.
 */
export declare function streamSessionEvents(sessionId: string, options?: SessionEventStreamOptions): AsyncGenerator<SessionStreamEvent, void, undefined>;
