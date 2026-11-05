/**
 * Closes a session's durable stream when its run ends without the terminal publication closing
 * it: a session a turn ended, or a run that lost its continuation claim. Readers then reach the
 * stream's end, and the route tells them with `stream.ended`. Never throws: a stream already
 * closed stays closed.
 */
export declare function closeSessionStreamStep(input: {
    readonly sessionWritable: WritableStream<Uint8Array>;
}): Promise<void>;
