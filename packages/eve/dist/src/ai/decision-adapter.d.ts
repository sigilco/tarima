import * as aiSdk from "ai";
import type { DecisionOptions, DecisionQuestion } from "#ai/decision-types.js";
export declare const DEFAULT_DECISION_MODEL = "typesafe-ai/jev";
/** Internal eval diagnostics retain SDK metadata without promising it to applications. */
export declare function decideWithMetadata<const Questions extends Readonly<Record<string, DecisionQuestion>>>({ model, state, questions, maxRetries, signal, providerOptions, }: DecisionOptions<Questions>): Promise<aiSdk.Experimental_DecisionResult<Questions>>;
