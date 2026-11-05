/** Marker path relative to one trace directory. */
export declare function localTraceConversationMarker(conversationId: string): string;
/** Marker proving that a trace was written by an index-aware writer. */
export declare function localTraceIndexedMarker(): string;
/**
 * Records conversation membership without rewriting shared state. Empty marker
 * creation is idempotent, so overlapping dev workers cannot lose each other's
 * conversation entries.
 */
export declare function indexLocalTraceConversation(input: {
    readonly conversationId: string;
    readonly traceDirectory: string;
}): Promise<void>;
