/** Wrap an already serialized (and possibly encrypted) abort packet. */
export declare function frameAbortStreamPayload(payload: Uint8Array): Uint8Array;
/**
 * Read one abort packet independently of transport chunk boundaries.
 * New packets have the usual big-endian length envelope; older writers send
 * a format-prefixed packet directly. Try decoding those after each read so a
 * complete legacy packet does not depend on the separate best-effort close.
 * Without a decoder, only EOF establishes the end of an unframed packet.
 */
export declare function readAbortStreamPacket(reader: ReadableStreamDefaultReader<Uint8Array>, tryDecode?: (packet: Uint8Array) => Promise<void>): Promise<Uint8Array | undefined>;
//# sourceMappingURL=abort-stream.d.ts.map