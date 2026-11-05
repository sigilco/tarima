import type { EveEvalTraceContext } from "#evals/types.js";
/** Identifies one runtime trace by the IDs Datadog's APM-to-LLMObs indexer assigns. */
export interface ExperimentRuntimeTraceLink {
    readonly relation: "experiment_runtime";
    readonly traceId: string;
    readonly spanId: string;
    readonly sessionId: string;
    readonly primary: boolean;
}
/** Converts sampled runtime trace contexts to Datadog-indexed links; skips the rest. */
export declare function resolveRuntimeTraceLinks(traceContexts: readonly EveEvalTraceContext[]): ExperimentRuntimeTraceLink[];
