import type { LocalTraceSummary } from "#tracing/local/trace-summary.js";
export type LocalTraceSortBy = "duration" | "failures" | "inputTokens" | "latest";
interface LocalTraceQueryFilter {
    readonly agentName?: string;
    /** Selects traces containing error spans, not necessarily failed activations. */
    readonly failedOnly?: boolean;
    readonly sessionId?: string;
    readonly toolName?: string;
}
/** Filters whole traces without restricting their totals to matching spans. */
export declare function queryLocalTraceSummaries(summaries: readonly LocalTraceSummary[], options: LocalTraceQueryFilter & {
    readonly limit: number;
    readonly sortBy: LocalTraceSortBy;
}): {
    readonly matches: readonly LocalTraceSummary[];
    readonly truncated: boolean;
};
export {};
