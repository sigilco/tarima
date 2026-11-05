import type { ModelMessage } from "ai";
import type { RuntimeToolResultActionResult } from "#shared/action-types.js";
import type { JsonValue } from "#shared/json.js";
import { TASK_CANCEL_TOOL_NAME, TASK_WAIT_TOOL_NAME } from "#protocol/task-tools.js";
/**
 * Calls to the task tools. They defer out of the model step like
 * workflow tool calls; the session answers them instead of a workflow run.
 */
export type TaskToolCall = {
    readonly callId: string;
    readonly kind: typeof TASK_WAIT_TOOL_NAME;
    readonly timeoutMs?: number;
} | {
    readonly callId: string;
    readonly kind: typeof TASK_CANCEL_TOOL_NAME;
    readonly taskId: string;
};
/**
 * The task tool calls a parked step's response still waits on. The response
 * is the one record of these calls: a call without a result is pending, and
 * a call with invalid input already carries its error result. The `eve`
 * namespace is reserved, so no authored tool's call matches.
 */
export declare function pendingTaskToolCalls(messages: readonly ModelMessage[]): TaskToolCall[];
/** Why an `eve__task_wait` call, or a held turn, stopped waiting. */
export type TaskWaitResult = {
    readonly status: "settled";
    /** Tasks whose results follow; both lists are empty when nothing was working. */
    readonly settled: readonly {
        readonly id: string;
        readonly status: "completed" | "failed";
    }[];
    readonly working: readonly string[];
} | {
    readonly status: "timeout" | "interrupt";
    readonly working: readonly string[];
};
export interface TaskCancelResult {
    readonly resumable: boolean;
    readonly status: "cancelled" | "already_finished";
    readonly tool: string;
}
export declare function taskToolResult(callId: string, toolName: string, output: JsonValue): RuntimeToolResultActionResult;
