import type { StandardSchemaV1 } from "#compiled/@standard-schema/spec/index.js";
import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import { type ToolModelOutputValue } from "#harness/tool-model-output.js";
import type { JsonObject } from "#shared/json.js";
/** The result of checking one tool call's input the way a model-issued call is checked. */
export type ToolCallInputCheck = {
    readonly kind: "valid";
    readonly value: JsonObject;
} | {
    readonly kind: "invalid";
    /** What is wrong with the input, for a caller that reports it in its own words. */
    readonly issues: readonly StandardSchemaV1.Issue[];
    readonly message: string;
} | {
    readonly kind: "threw";
    readonly error: unknown;
};
/**
 * Checks a tool call's input the way a conversation does: no input (or an
 * empty string) is `{}`, anything else that is not a JSON object is
 * rejected, and the rest must satisfy the schema the model was given.
 */
export declare function checkToolCallInput(definition: Pick<HarnessToolDefinition, "inputSchema" | "name">, input: unknown, callId: string): Promise<ToolCallInputCheck>;
/**
 * What the model sees for a tool's output: pending sign-in text, the
 * author's `toModelOutput`, or the output as text or JSON.
 */
export declare function toolCallModelOutput(definition: Pick<HarnessToolDefinition, "name" | "toModelOutput">, output: unknown, toolCallId: string | undefined): Promise<ToolModelOutputValue>;
