import type { ModelMessage } from "ai";
import type { InlineCallResults } from "#harness/call-executor.js";
import type { HarnessStepResult } from "#harness/step-hooks.js";
import type { HarnessToolLookup } from "#harness/types.js";
type StepResponseMessage = HarnessStepResult["response"]["messages"][number];
type ToolResponsePart = Extract<ModelMessage, {
    role: "tool";
}>["content"][number];
type ToolResultPart = Extract<ToolResponsePart, {
    type: "tool-result";
}>;
/**
 * The step as the harness reads it: the AI SDK's result, with the results of the calls eve ran or
 * answered appended to the response, and what the calls wait on.
 */
export declare function withCallResults(input: {
    readonly stepResult: HarnessStepResult;
    readonly responseMessages: readonly StepResponseMessage[];
    readonly calls: InlineCallResults;
    /** Results for calls that didn't run. */
    readonly answers: readonly ToolResultPart[];
    readonly invalidInputToolCallIds?: ReadonlySet<string>;
}): HarnessStepResult;
/** True when provider history still owes a result for any assistant tool call. */
export declare function hasUnansweredToolCall(messages: readonly ModelMessage[]): boolean;
/**
 * Appends tool results for calls that have no result anywhere in the step's response messages.
 * The response's results share one tool message, in the order the model made its calls: the AI
 * SDK answers an invalid call as it streams, and eve's calls run once the response ends.
 *
 * Exported for its dedupe contract: a call already answered — including provider-executed
 * results the SDK keeps inline in the assistant message — must never receive a second
 * `tool-result`, or the next Anthropic call rejects the history with "each tool_use must have a
 * single result".
 */
export declare function appendMissingToolResultMessages(input: {
    readonly append: readonly ToolResultPart[];
    readonly responseMessages: readonly StepResponseMessage[];
}): StepResponseMessage[];
/**
 * CallIds answered anywhere in the response messages. Scans every message
 * role: provider-executed tool results arrive inline in the *assistant*
 * message (the SDK only moves them to a `tool` message during provider
 * history normalization, which runs after the backfill paths), so a
 * tool-message-only scan would let a synthesized result duplicate them.
 */
export declare function extractToolResultCallIds(messages: readonly ModelMessage[]): ReadonlySet<string>;
/** Answers the local calls of a response that ended early: eve doesn't run them. */
export declare function answerSkippedToolCalls(step: HarnessStepResult, tools: HarnessToolLookup, excludedCallIds: ReadonlySet<string>): ToolResultPart[];
export {};
