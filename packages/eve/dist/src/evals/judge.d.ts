import type { AssertionCollector } from "#evals/assertions/collector.js";
import type { EveEvalJudgeConfig, JudgeContext } from "#evals/types.js";
interface JudgeDeps {
    readonly collector: AssertionCollector;
    readonly getReply: () => string | null;
    readonly getInput: () => string;
    readonly judge: EveEvalJudgeConfig | undefined;
    readonly signal: AbortSignal;
}
/** Bind decision-backed judgments to the existing assertion lifecycle. */
export declare function buildJudgeContext(deps: JudgeDeps): JudgeContext;
export {};
