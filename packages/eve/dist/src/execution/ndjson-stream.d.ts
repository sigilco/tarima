/**
 * Transforms a byte stream of newline-delimited JSON (NDJSON) into a
 * stream of parsed values.
 *
 * The source is read on demand: each pull reads only until it can enqueue
 * at least one value, so a slow consumer applies backpressure to the source
 * instead of this stream buffering everything the source can deliver.
 *
 * Cancellation is forwarded to the source. When the returned stream is
 * cancelled — e.g. an SSE client disconnects and the server cancels the
 * response body — the underlying reader is cancelled too. This matters for
 * runs that never reach EOF: a parked durable run keeps
 * its event stream open indefinitely, and the world-local streamer runs a
 * filesystem poll until its reader is cancelled. Without forwarding the
 * cancel, a pending `reader.read()` would block forever and that poll would
 * leak for the life of the process, degrading streaming throughput for every
 * other session.
 */
export declare function parseNdjsonStream<T>(createByteStream: () => ReadableStream<Uint8Array>, parse?: (value: unknown) => T): ReadableStream<T>;
