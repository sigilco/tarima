import type { AssertionResult, EveEvalVerdict } from "#evals/types.js";
/**
 * Computes the per-eval verdict from the execution outcome and recorded
 * assertions. An execution error or a failed gate assertion is a hard
 * failure; a below-threshold soft assertion at worst demotes the eval to
 * `"scored"` (which `eve eval --strict` later promotes to a failing exit
 * code). Entries without an acceptance rule carry no verdict and never
 * demote the eval.
 */
export declare function computeEvalVerdict(input: {
    readonly error?: string;
    readonly assertions: readonly AssertionResult[];
    readonly skipReason?: string;
}): EveEvalVerdict;
