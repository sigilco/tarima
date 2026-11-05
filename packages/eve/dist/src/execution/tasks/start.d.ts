import { type TaskTable } from "#execution/tasks/table.js";
import { type StartWorkflowTaskInput } from "#execution/tools/workflow/start.js";
import type { HarnessSessionBase } from "#harness/types.js";
import type { TaskCallStart } from "#harness/session-machine/transitions.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
import type { RuntimeToolResultActionResult, RuntimeWorkflowTaskRequest, WorkflowToolRunEntry } from "#shared/action-types.js";
type TaskDispatchInput = StartWorkflowTaskInput & {
    readonly taskId: string;
};
/** The call's answer, and the task start the dispatch reports for it. */
interface TaskDispatchResult {
    readonly result: RuntimeToolResultActionResult;
    readonly session: HarnessSessionBase;
    readonly started?: TaskCallStart;
    /** A dispatch admission refused the call before any run started. Not inferred from output. */
    readonly refusal?: "task-limit" | "task-unavailable";
}
/** The entry of a run that does a task's work. */
type TaskRunEntry = Extract<WorkflowToolRunEntry, {
    readonly taskId: string;
}>;
/**
 * Starts the run for a task its model step committed, once, and answers the
 * call with its receipt and the `task.started` data the next step publishes.
 * Runs inside the dispatch step, where the task's cap is enforced: past it,
 * the record is dropped and the call fails.
 */
export declare function startTaskRun(input: StartWorkflowTaskInput & {
    readonly entry: TaskRunEntry;
}, admissionView?: SessionView): Promise<TaskDispatchResult>;
/**
 * Sends a call to the `serve` task it names by `taskId`. The task must be
 * available to the tool, and a call that makes an idle task work again
 * counts toward the cap. The call is recorded, reported as started, and sent
 * to the task's run, whose body receives it from `receive()`.
 */
export declare function sendToTask(input: TaskDispatchInput, admissionView?: SessionView): Promise<TaskDispatchResult>;
/**
 * The entry of the run that dispatching `task` starts, or `undefined` when it
 * starts none: a call to a running task, or a task cancelled before the
 * session could start it. The task cap can still refuse a task's run.
 */
export declare function runEntryToStart(table: TaskTable, view: SessionView, task: RuntimeWorkflowTaskRequest): WorkflowToolRunEntry | undefined;
/**
 * Whether dispatching `tasks` in order starts every run {@link runEntryToStart}
 * names. A call to a running task can take a slot under the task cap, and
 * sending to it can fail the batch, so such a batch never qualifies.
 */
export declare function startsEveryRun(table: TaskTable, view: SessionView, tasks: readonly RuntimeWorkflowTaskRequest[]): boolean;
export {};
