import type { TaskCancelResult, TaskWaitResult } from "#execution/tasks/calls.js";
export declare const TASK_WAIT_DESCRIPTION = "Call eve__task_wait sparingly, only when you deliberately want to withhold a message from the user while waiting for a task result. Tasks keep running and their results reach you without calling eve__task_wait. If the user should hear from you now, reply instead. Wait silently until any of your tasks has a result, a new message arrives, or timeoutSeconds pass. It returns after the first result, which follows in a <task_result> message; wait again only if you still want to withhold a reply until another result arrives. Waiting never stops a task.";
export declare const TASK_WAIT_TIMEOUT_DESCRIPTION = "Optional. Seconds to wait before returning without a result. Omit it to wait for a result or a new message, which is almost always right. Don't use short timeouts to check on tasks: results reach you without checking.";
export declare const TASK_CANCEL_DESCRIPTION = "Stop a task's current work. That work never reports back; if it already had a result, that result is still delivered. Cancelling an agent or one-shot task ends it; start a new task to delegate again. Other tasks that accept more input stay available: call their tool with the taskId to give them new work.";
export declare const TASK_CANCEL_TASK_ID_DESCRIPTION = "The id of the task to stop, copied from its \"Started task\" receipt or the [Tasks] note.";
/** The task block for a session a person reads, where a reply before a result is posted. */
export declare const TASK_SYSTEM_BLOCK: string;
/**
 * The task block for a child or schedule session, whose caller reads only the final reply: a held
 * turn's text there is narration.
 */
export declare const FINAL_REPLY_TASK_SYSTEM_BLOCK: string;
/** Appended to a `serve` tool's description. */
export declare const SERVE_TOOL_DESCRIPTION = "To send this task more input, call this tool again with its taskId; without taskId, each call starts a new task.";
/** Appended to an agent tool's description, in place of the `serve` tool sentence. */
export declare const AGENT_SERVE_TOOL_DESCRIPTION = "It does not see this conversation, so put everything it needs in message. To correct or continue an agent task, call this tool again with its taskId; without taskId, each call starts a new agent.";
/** Describes the `taskId` eve adds to a `serve` tool's model input. */
export declare const TASK_ID_INPUT_DESCRIPTION = "The id of a task this tool started, copied from its \"Started task\" receipt or the [Tasks] note, to send it this input. Omit it to start a new task.";
/** Labels the `context.state` note that lists the turn's tasks. */
export declare const TASKS_NOTE_LABEL = "[Tasks]";
/** Opens every block of a `task.result` message. */
export declare const TASK_RESULT_TAG = "<task_result";
/** The failure a task reports when its record could not be decoded. */
export declare const UNREADABLE_TASK_ERROR = "The task's state could not be read.";
/** The receipt for a call that starts a task; a resumable task's says how to reach it again. */
export declare function renderTaskReceipt(task: {
    readonly id: string;
    readonly resumable: boolean;
    readonly tool: string;
}): string;
/** The receipt for a call that reaches a resumable task by its `taskId`. */
export declare function renderTaskSentReceipt(taskId: string): string;
export declare function renderUnknownTaskError(taskId: string, tool: string): string;
export declare function renderUnknownCancelTaskError(taskId: string): string;
/** What the model reads when `eve__task_cancel` answers. */
export declare function renderTaskCancelResult(taskId: string, result: TaskCancelResult): string;
export declare function renderTooManyTasksError(max: number, workingIds: readonly string[]): string;
export declare function renderFinalOutputWhileWorkingError(workingIds: readonly string[]): string;
/** What the model reads when `eve__task_wait` returns after waiting `waitedMs`. */
export declare function renderTaskWaitResult(result: TaskWaitResult, waitedMs: number): string;
/** One `<task_result>` block of a `task.result` message. */
export interface TaskResultBlock {
    readonly body: string;
    readonly status: "completed" | "failed";
    readonly taskId: string;
    readonly tool: string;
}
/**
 * The `task.result` message: one `<task_result>` block per result. All
 * bodies share one size budget; a body past it is cut and marked.
 */
export declare function renderTaskResults(results: readonly TaskResultBlock[]): string;
/**
 * The blocks of a `task.result` message, in order, as a deterministic mock
 * model reads them back; empty for any other text.
 */
export declare function readTaskResults(message: string): TaskResultBlock[];
/** The text of a tool's `toModelOutput` result, or of a raw output without one. */
export declare function renderModelOutputText(output: unknown): string;
/** A task as the `[Tasks]` note lists it. */
export interface ListedTask {
    readonly id: string;
    readonly tool: string;
}
/** The `[Tasks]` note: working tasks, then idle resumable tasks when there are any. */
export declare function renderTasksNote(input: {
    readonly idle: readonly ListedTask[];
    readonly working: readonly ListedTask[];
}): string;
