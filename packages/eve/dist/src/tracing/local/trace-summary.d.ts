import type { LocalTraceSpan } from "#tracing/local/trace-reader.js";
/** Structural metadata and totals for one retained trace, not its final outcome. */
export interface LocalTraceSummary {
    readonly traceId: string;
    readonly startedAt: string;
    /** Elapsed time from the earliest span start to the latest span end. */
    readonly durationMs: number;
    readonly spanCount: number;
    readonly agentNames: readonly string[];
    readonly conversationIds: readonly string[];
    readonly sessionIds: readonly string[];
    readonly models: readonly string[];
    readonly toolNames: readonly string[];
    readonly modelCalls: number;
    readonly toolCalls: number;
    /** Error-bearing spans; one failure can be recorded on multiple ancestors. */
    readonly errorSpanCount: number;
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly cacheReadTokens: number;
    readonly cacheWriteTokens: number;
    /** Total gateway cost in USD; undefined when no step reported cost. */
    readonly costUsd?: number;
}
/**
 * Only agent.step spans contribute usage: model spans repeat the same counters.
 * Operation counts collapse action/execution pairs, but error counts retain all
 * error-bearing spans so summaries agree with the raw trace tree.
 */
export declare function summarizeLocalTrace(traceId: string, spans: readonly LocalTraceSpan[]): LocalTraceSummary;
export declare function localTraceSpanCostUsd(span: LocalTraceSpan): number | undefined;
