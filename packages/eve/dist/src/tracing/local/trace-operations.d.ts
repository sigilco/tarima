import type { LocalTraceSpan } from "#tracing/local/trace-reader.js";
export interface LocalTraceOperation {
    readonly span: LocalTraceSpan;
    readonly category: "model" | "other" | "tool";
    readonly actionDurationMs?: number;
}
export declare function uniqueLocalTraceSpans(spans: readonly LocalTraceSpan[]): LocalTraceSpan[];
/** Pairs action wrappers with execution spans without constructing a sorted timeline. */
export declare function localTraceOperations(spans: readonly LocalTraceSpan[]): LocalTraceOperation[];
export declare function traceModelName(span: LocalTraceSpan): string | undefined;
export declare function traceToolName(span: LocalTraceSpan): string | undefined;
export declare function traceSessionId(span: LocalTraceSpan): string | undefined;
export declare function traceStringAttribute(span: LocalTraceSpan, key: string): string | undefined;
