import type { ModelMessage } from "ai";
import type { RuntimeActionRequest, RuntimeActionResult, RuntimeWorkflowTaskRequest, WorkflowToolCallEntry } from "#shared/action-types.js";
import { type JsonObject } from "#shared/json.js";
import type { HarnessSession, HarnessToolLookup } from "#harness/types.js";
type ToolResponsePart = Extract<ModelMessage, {
    role: "tool";
}>["content"][number];
type ToolResultPart = Extract<ToolResponsePart, {
    type: "tool-result";
}>;
/** Rejects a batch before any result or side effect can bind ambiguously by call id. */
export declare function assertUniqueCoordinationCallIds(requests: readonly {
    readonly callId: string;
}[]): void;
/**
 * Forgets the workflow runs whose results arrived. Nobody can answer what a finished run asked,
 * so its relayed requests are returned for the machine to withdraw.
 */
export declare function forgetFinishedRuns(session: HarnessSession, results: readonly RuntimeActionResult[], turnId: string): {
    readonly requestIds: readonly string[];
    readonly session: HarnessSession;
};
/** Each runtime result as the model reads it, beside the result the stream reports. */
export declare function runtimeResultCalls(results: readonly RuntimeActionResult[], tools: HarnessToolLookup | undefined): Promise<{
    readonly part: ToolResultPart;
    readonly result: RuntimeActionResult;
}[]>;
/**
 * Turns a step's workflow tool calls into workflow runs, committing a task
 * record for each call that starts a task. Task tool calls stay in the
 * response alone: the session reads them from there.
 */
export declare function collectWorkflowCalls(input: {
    readonly session: HarnessSession;
    readonly toolCalls: readonly CoordinationToolCall[];
    readonly tools: HarnessToolLookup;
    readonly turnId: string;
}): {
    readonly session: HarnessSession;
    readonly workflowRequests: readonly RuntimeWorkflowTaskRequest[];
};
/** The parts of a model tool call that coordination turns into a runtime request. */
export interface CoordinationToolCall {
    readonly input: unknown;
    readonly toolCallId: string;
    readonly toolName: string;
}
/**
 * Projects one AI SDK tool call into the eve runtime-action contract.
 */
export declare function createRuntimeActionRequestFromToolCall(input: {
    readonly toolCall: CoordinationToolCall;
    readonly tools: HarnessToolLookup;
}): RuntimeActionRequest;
/**
 * Projects one workflow tool call into a workflow run request. The input is
 * the tool's own, without anything eve added to its model input.
 */
export declare function createCoordinationRequestFromToolCall(input: {
    readonly entry: WorkflowToolCallEntry;
    readonly input: JsonObject;
    readonly toolCall: CoordinationToolCall;
    readonly tools: HarnessToolLookup;
}): RuntimeWorkflowTaskRequest;
/**
 * Coerces an AI SDK tool-call `input` into the runtime-action `JsonObject`
 * contract, throwing a `TypeError` (with the original as `cause`) that names
 * the offending tool when the payload is not a JSON object.
 *
 * String inputs are parsed as JSON first: the model protocol carries tool
 * arguments as text, and provider-executed tool calls can surface that raw
 * string — or an empty string when the model sends no arguments.
 */
export declare function resolveToolCallInputObject(value: unknown, context: {
    readonly callId: string;
    readonly toolName: string;
}): JsonObject;
export {};
