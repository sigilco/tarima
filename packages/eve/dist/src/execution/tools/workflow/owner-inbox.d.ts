import type { SubagentInteractionHookPayload } from "#channel/types.js";
import type { WorkflowToolAskRequest, WorkflowToolRunOutcomeMessage, WorkflowToolRunRequestMessage } from "#execution/tools/workflow/messages.js";
import type { RuntimeToolResultActionResult } from "#shared/action-types.js";
import { type JsonValue } from "#shared/json.js";
export declare function workflowToolRunOutcomeToToolResult(message: WorkflowToolRunOutcomeMessage): RuntimeToolResultActionResult;
export declare function workflowToolRunFailureOutput(message: WorkflowToolRunOutcomeMessage): JsonValue;
/**
 * A run's `ctx.ask()` question, relayed like any request: an interaction the run opens, about
 * the call it serves. The run is the asker, so its question names the run as its origin.
 */
export declare function workflowAskPayload(message: WorkflowToolRunRequestMessage & {
    readonly request: WorkflowToolAskRequest;
}): SubagentInteractionHookPayload;
