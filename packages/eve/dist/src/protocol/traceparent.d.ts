interface TraceparentContext {
    readonly isRemote?: boolean;
    readonly spanId: string;
    readonly traceFlags: number;
    readonly traceId: string;
}
/** Formats a W3C version-00 traceparent, or omits an invalid context. */
export declare function formatTraceparent(context: TraceparentContext | undefined): string | undefined;
/** Parses a W3C version-00 traceparent without rejecting the containing request. */
export declare function parseTraceparent(value: string | null): TraceparentContext | undefined;
/**
 * Restores the eve caller span preserved in W3C `tracestate`.
 *
 * `traceparent` remains the immediate HTTP parent, so its trace identity and
 * flags stay authoritative while eve's vendor entry supplies the earlier
 * semantic caller span ID.
 */
export declare function readAgentDispatchTraceContext(value: string | null, transport: TraceparentContext | undefined): TraceparentContext | undefined;
/**
 * Writes eve's prior-parent vendor entry while preserving other valid
 * `tracestate` members and W3C size limits.
 */
export declare function writeAgentDispatchTracestate(value: string | undefined, context: TraceparentContext | undefined): string | undefined;
export {};
