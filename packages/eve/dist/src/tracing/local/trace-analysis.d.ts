import type { LocalTraceSpan } from "#tracing/local/trace-reader.js";
import { type LocalTraceSummary } from "#tracing/local/trace-summary.js";
interface TraceAnalysisSelector {
    readonly excludeSessionId?: string;
    readonly fromMs?: number;
    readonly sessionId?: string;
    readonly toMs?: number;
    readonly turnId?: string;
}
export interface TraceTokenUsage {
    readonly inputTokens?: number;
    readonly outputTokens?: number;
    readonly cacheReadTokens?: number;
    readonly cacheWriteTokens?: number;
}
interface TraceTimelineRecord {
    readonly actionDurationMs?: number;
    readonly actionName?: string;
    readonly callId?: string;
    readonly category: "model" | "other" | "tool";
    readonly durationMs: number;
    readonly endOffsetMs: number;
    readonly error?: string;
    readonly model?: string;
    readonly outcome: "completed" | "failed";
    readonly parentSpanId?: string;
    readonly sessionId?: string;
    readonly spanId: string;
    readonly startOffsetMs: number;
    readonly toolName?: string;
    readonly turnId?: string;
    readonly usage?: TraceTokenUsage;
}
interface TraceAnalysis {
    readonly summary: LocalTraceSummary;
    readonly groups: readonly TraceAnalysisGroup[];
    /** Accumulated operation time, not elapsed time; parallel calls can overlap. */
    readonly modelWorkMs: number;
    readonly toolWorkMs: number;
    readonly records: readonly TraceTimelineRecord[];
}
export interface TraceAnalysisGroup {
    readonly modelWorkMs: number;
    readonly modelCalls: number;
    readonly sessionId?: string;
    readonly toolWorkMs: number;
    readonly toolCalls: number;
    readonly turnId?: string;
}
/** Builds the detailed timeline only when inspection, rather than search, needs it. */
export declare function analyzeLocalTrace(traceId: string, spans: readonly LocalTraceSpan[], selector?: TraceAnalysisSelector): TraceAnalysis;
export {};
