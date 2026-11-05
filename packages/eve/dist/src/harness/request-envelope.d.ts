import type { ModelMessage, ToolSet } from "ai";
/** Count only request content outside the durable model-visible history. */
export declare function estimateRequestEnvelope(input: {
    readonly history: readonly ModelMessage[];
    readonly instructions: unknown;
    readonly messages: readonly ModelMessage[];
    readonly tools: ToolSet;
}): Promise<number>;
