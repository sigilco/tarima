import type { ToolSet, TypedToolCall } from "ai";
import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import type { HarnessToolLookup } from "#harness/types.js";
import type { RuntimeActionRequest } from "#shared/action-types.js";
export interface RuntimeActionRequestProjection {
    readonly action: RuntimeActionRequest;
    readonly presentationLabel?: string;
}
export declare function createPresentedRuntimeActionRequestFromToolCall(input: {
    readonly toolCall: TypedToolCall<ToolSet>;
    readonly tools: HarnessToolLookup;
}): RuntimeActionRequestProjection;
/** Label callbacks share normalization, detached input, and failure isolation. */
export declare function projectToolLabel(definition: {
    readonly label?: HarnessToolDefinition["label"];
} | undefined, phase: "start" | "delta" | "complete", input: unknown, output?: unknown): string | undefined;
