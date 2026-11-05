import { type ReadRecord } from "#protocol/session-events/envelope.js";
/**
 * Returns true when an error looks like a stream socket disconnection that
 * can be recovered via reconnection.
 */
export declare function isStreamDisconnectError(error: unknown): boolean;
/**
 * Reads the records of one stream response: stored lines (commits and progress records),
 * transport records (`$eve`), and lines this version can't read, each classified by key. Blank
 * lines are skipped. Handles partial lines across chunks via an internal buffer.
 *
 * All read errors — including socket disconnections — propagate to the caller.
 * Use {@link isStreamDisconnectError} to classify them.
 */
export declare function readNdjsonStream(body: ReadableStream<Uint8Array>, options?: {
    readonly idleTimeoutMs?: number;
    readonly signal?: AbortSignal;
}): AsyncGenerator<ReadRecord>;
