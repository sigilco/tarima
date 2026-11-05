import type { EveEvalTaskResult } from "#evals/types.js";
/** Structured null is an output, not a reason to fall back to reply text. */
export declare function outputOf(result: Pick<EveEvalTaskResult, "data" | "reply"> | undefined): unknown;
