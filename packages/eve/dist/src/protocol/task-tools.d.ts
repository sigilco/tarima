import type { FactOf } from "#protocol/session-events/facts.js";
export declare const TASK_WAIT_TOOL_NAME = "eve__task_wait";
export declare const TASK_CANCEL_TOOL_NAME = "eve__task_cancel";
/** The task tools' names. */
export declare const TASK_TOOL_NAMES: readonly string[];
/**
 * Whether a tool call is the model managing its own tasks. The stream keeps
 * these calls so evals and traces can see them, but activity surfaces hide
 * them: people see the tasks, not the model waiting on or stopping them. The
 * `eve` namespace is reserved, so no authored tool matches.
 */
export declare function isTaskControlTool(toolName: string): boolean;
export declare const TOO_MANY_TASKS_CODE = "TOO_MANY_TASKS";
export declare const UNKNOWN_TASK_CODE = "UNKNOWN_TASK";
/**
 * A framework task admission refused the call before starting any work. The lifecycle says so;
 * an authored tool's output or error code never decides admission. Activity surfaces hide these
 * refusals while the model follows their recovery guidance.
 */
export declare function isTaskAdmissionRefused(call: {
    readonly outcome?: string;
    readonly cause?: FactOf<"call.settled">["data"]["cause"];
}): boolean;
