import type { DecisionOptions, DecisionQuestion, DecisionResult } from "#ai/decision-types.js";
/** Decide typed questions about shared state using eve's model authentication. */
export declare function decide<const Questions extends Readonly<Record<string, DecisionQuestion>>>(options: DecisionOptions<Questions>): Promise<DecisionResult<Questions>>;
