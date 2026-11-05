import type { SystemModelMessage } from "ai";
import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import { type HarnessModelMessage } from "#harness/messages.js";
import type { HarnessSession, HarnessToolLookup, HarnessToolMap } from "#harness/types.js";
import type { WorkflowToolCallEntry } from "#shared/action-types.js";
import type { JsonObject } from "#shared/json.js";
export declare function isTaskTool(definition: HarnessToolDefinition | undefined): boolean;
/** Workflow tools, and the task tools that control them, run after the model step. */
export declare function isWorkflowTool(definition: HarnessToolDefinition | undefined): boolean;
/** Adds `eve__task_wait` and `eve__task_cancel` to the tools of a session that offers tasks. */
export declare function withTaskTools(tools: HarnessToolMap): HarnessToolMap;
/**
 * The task block, when the session offers tasks. `finalReplyOnly` is set for a child or schedule
 * session, whose caller reads only the final reply, so a reply before a result reaches no one.
 */
export declare function taskSystemMessages(offers: boolean, finalReplyOnly: boolean): SystemModelMessage[];
/** A workflow tool call as the model made it, before the session knows what it enters. */
export interface WorkflowCall {
    readonly callId: string;
    readonly definition: HarnessToolDefinition | undefined;
    /** The call's model input. */
    readonly input: JsonObject;
    readonly toolName: string;
    readonly turnId: string;
}
/** How a workflow tool call enters its workflow, with the tool's own input. */
export interface CommittedCallEntry {
    readonly entry: WorkflowToolCallEntry;
    readonly input: JsonObject;
    readonly session: HarnessSession;
}
/**
 * How a workflow tool call enters its workflow. A call that starts a task commits
 * the task's record alongside the call, so the run starts with its id; a
 * `serve` tool's call with `taskId` goes to that task's `receive()`, which the
 * session checks when it sends the call.
 */
export declare function commitCallEntry(session: HarnessSession, call: WorkflowCall): CommittedCallEntry;
export declare function workingTaskIds(session: HarnessSession): readonly string[];
/**
 * The messages a model step appends for tasks, before any new input: one
 * `task.result` message with every settled result, then the
 * `[Tasks]` note when the listing changed. The results are marked delivered
 * in the same step. The message lives only in the model's history: clients
 * read outcomes from `call.settled`.
 */
export declare function appendTaskContext(input: {
    readonly messages: readonly HarnessModelMessage[];
    readonly session: HarnessSession;
    readonly tools: HarnessToolLookup;
}): Promise<{
    readonly messages: readonly HarnessModelMessage[];
    readonly session: HarnessSession;
}>;
