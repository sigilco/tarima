import type { SessionStateCursor } from "#execution/session/state-cursor.js";
import { type TaskToolCall } from "#execution/tasks/calls.js";
import { type TaskRunMessage } from "#execution/tasks/steps.js";
import { type TaskTable } from "#execution/tasks/table.js";
import type { WorkflowToolRunMessage } from "#execution/tools/workflow/messages.js";
import type { TaskCancelReason } from "#execution/tasks/table.js";
import { TASK_CANCEL_TOOL_NAME } from "#protocol/task-tools.js";
import type { RuntimeActionResult } from "#shared/action-types.js";
/** Whether a run's message changes a task record. */
export declare function isTaskRunMessage(message: WorkflowToolRunMessage): message is TaskRunMessage;
/** The session's task table as the workflow body last committed it. */
export declare function sessionTaskTable(cursor: SessionStateCursor): TaskTable;
/**
 * Cancels every working task: `session.cancel()` stops them, and a turn that
 * ends anyway, such as by failing, cancels the tasks it held on. With
 * `turnCalls`, the workflow tool runs the turn waits on stop in the same step.
 */
export declare function cancelWorkingTasks(cursor: SessionStateCursor, reason: Exclude<TaskCancelReason, "task-cancel">, options?: {
    readonly turnCalls?: boolean;
}): Promise<void>;
export declare function answerTaskCancel(cursor: SessionStateCursor, call: Extract<TaskToolCall, {
    readonly kind: typeof TASK_CANCEL_TOOL_NAME;
}>): Promise<RuntimeActionResult>;
