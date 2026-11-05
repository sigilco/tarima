import type { TaskCancelResult, TaskWaitResult } from "#execution/tasks/calls.js";
import type { WorkflowToolRunCall } from "#execution/tools/workflow/messages.js";
import type { SessionStateMap } from "#harness/types.js";
import type { JsonValue } from "#shared/json.js";
import type { TokenUsage } from "#shared/token-usage.js";
/** At most this many tasks work at once in one session: a backstop normal use shouldn't reach. */
export declare const MAX_WORKING_TASKS = 32;
export interface TaskRunAddress {
    readonly hookToken: string;
    readonly runId: string;
}
/** The workflow run doing a task's work. `started` once its control hook can take commands. */
export interface TaskRun extends TaskRunAddress {
    readonly started: boolean;
    /** The run's delegated spend the session counted so far, which later totals count from. */
    readonly usage?: TokenUsage;
}
/** A call the task admitted and hasn't settled, with the turn that made it. */
export interface TaskCall {
    readonly callId: string;
    readonly turnId: string;
}
/**
 * A command for a task's run. Commands go over the run's one control hook, so
 * the run sees calls and cancels in the order the session issued them.
 */
export type TaskRunCommand = {
    readonly kind: "cancel";
} | {
    readonly call: WorkflowToolRunCall;
    readonly kind: "call";
};
/** Commands for one run, to send in order. */
export interface TaskRunCommands {
    readonly commands: readonly TaskRunCommand[];
    readonly run: TaskRunAddress;
}
/** How a task call ended, as `call.settled` reports it. */
export type TaskOutcome = {
    readonly output: JsonValue;
    readonly status: "completed";
} | {
    readonly error: string;
    readonly status: "failed";
} | {
    readonly reason?: TaskCancelReason;
    readonly status: "cancelled";
};
/**
 * An outcome the model receives, one per reply or run end, however many calls
 * it settled. Cancelled work never reports back.
 */
export type TaskResult = Exclude<TaskOutcome, {
    readonly status: "cancelled";
}> & {
    /**
     * Keep original call and turn IDs so output-processing failures in a later turn
     * can be recorded against the stubbed call.
     */
    readonly calls?: readonly TaskCall[];
};
export interface TaskRecord {
    readonly id: string;
    /** Whether the tool is an agent's, as `task.started` reports it. */
    readonly kind: "agent" | "tool";
    /** The tool whose call started the task. */
    readonly name: string;
    /** A `serve` tool's task: it takes more calls by its id, and is idle between results. */
    readonly resumable: boolean;
    /** Calls without a result. The task is working while any remain. */
    readonly calls: readonly TaskCall[];
    /** Results not yet delivered to the model. */
    readonly results: readonly TaskResult[];
    /** A one-shot task cancelled while its run may still report messages. */
    readonly cancelled?: boolean;
    /** The task's run, from its start until it finishes. */
    readonly run?: TaskRun;
    /** Commands issued before the run could take them, sent in order once it reports started. */
    readonly held?: readonly TaskRunCommand[];
}
export interface TaskTable {
    readonly tasks: readonly TaskRecord[];
}
export declare function readTaskTable(state: SessionStateMap | undefined): TaskTable;
export declare function writeTaskTable<T extends {
    readonly state?: SessionStateMap;
}>(session: T, table: TaskTable): T;
export declare function findTask(table: TaskTable, taskId: string): TaskRecord | undefined;
/** A task message belongs to a live, uncancelled run of this session. */
export declare function isActiveTaskRun(table: TaskTable, taskId: string, runId: string): boolean;
/** Only the recorded cancelled run can confirm its outcome and relinquish ownership. */
export declare function isCancelledTaskRun(table: TaskTable, taskId: string, runId: string): boolean;
export declare function isTaskWorking(record: TaskRecord): boolean;
export declare function workingTasks(table: TaskTable): readonly TaskRecord[];
/**
 * The most recently used idle resumable tasks, oldest first. The table keeps
 * records in order of use, so the last ones are the most recent.
 */
export declare function idleTasks(table: TaskTable): readonly TaskRecord[];
/**
 * Whether a call may reach the task by its id: the task is resumable and
 * unfinished, and was started by this tool.
 */
export declare function isTaskAvailable(record: TaskRecord | undefined, toolName: string): record is TaskRecord & {
    readonly run: TaskRun;
};
/** Tasks whose results the model has not received yet. */
export declare function tasksWithResults(table: TaskTable): readonly TaskRecord[];
/**
 * What a wait on the turn's tasks returns now, or `undefined` to keep
 * waiting. A waiting result, or nothing left working, ends it first;
 * cancelled work never does.
 */
export declare function taskWaitResult(table: TaskTable, wake: {
    readonly interrupted: boolean;
    readonly timedOut: boolean;
}): TaskWaitResult | undefined;
/**
 * What `eve__task_cancel` answers, or `undefined` for a task that doesn't exist.
 * `cancelled` means the caller cancels the working task.
 */
export declare function taskCancelResult(table: TaskTable, taskId: string): TaskCancelResult | undefined;
/**
 * Every run the session started and hasn't seen finish: the calls a turn waits on, and every
 * task's run, including cancelled runs that haven't confirmed yet.
 */
export declare function liveRuns(state: SessionStateMap | undefined): readonly TaskRunAddress[];
/** Runs that may still be doing work, including cancelled runs that haven't confirmed yet. */
export declare function liveTaskRuns(table: TaskTable): readonly TaskRunAddress[];
/** Records a task for a call the model just made, with a new id. */
export declare function createTask(table: TaskTable, input: {
    readonly callId: string;
    readonly kind: TaskRecord["kind"];
    readonly name: string;
    readonly resumable: boolean;
    readonly turnId: string;
}): {
    readonly table: TaskTable;
    readonly taskId: string;
};
/** Drops a task that never started, such as one past the cap. */
export declare function removeTask(table: TaskTable, taskId: string): TaskTable;
export declare function recordTaskRun(table: TaskTable, taskId: string, run: TaskRunAddress): TaskTable;
/**
 * The run can take commands now. Commands issued before this were held on the
 * record; they are returned, in order, so the caller sends them.
 */
export declare function markTaskRunStarted(table: TaskTable, taskId: string, runId: string): {
    readonly held?: TaskRunCommands;
    readonly table: TaskTable;
};
/**
 * Records a call that reaches an available task by its id: the task is
 * working until the call has a result. The call goes to a started run now, or
 * is held until the run reports started. The record moves to the end of the
 * table, which keeps records in order of use.
 */
export declare function recordTaskCall(table: TaskTable, taskId: string, call: WorkflowToolRunCall): {
    readonly send?: TaskRunCommands;
    readonly table: TaskTable;
};
/**
 * Settles calls that share one outcome, as one reply does, in one step. Each
 * call settles once, with its own `call.settled`; the first outcome wins, so a
 * call already settled, including one its owner cancelled, is dropped. The
 * model receives the outcome once, since every call it settles would repeat it.
 */
export declare function settleTaskCalls(table: TaskTable, input: {
    readonly callIds: readonly string[];
    readonly outcome: TaskOutcome;
    readonly taskId: string;
}): {
    readonly settled: readonly TaskCall[];
    readonly table: TaskTable;
};
/**
 * Settles every call still without a result with one outcome, as a run's
 * return or failure does: a task's one call, or every call a resumable task
 * received, or never received, since its last reply.
 */
export declare function settleRemainingTaskCalls(table: TaskTable, taskId: string, outcome: TaskOutcome): {
    readonly settled: readonly TaskCall[];
    readonly table: TaskTable;
};
/** Records the run's delegated spend the session just counted. */
export declare function recordTaskRunUsage(table: TaskTable, taskId: string, usage: TokenUsage): TaskTable;
/** The task's run finished; nothing is left to cancel. */
export declare function finishTaskRun(table: TaskTable, taskId: string, runId: string): TaskTable;
/** What cancelling a task changed, and the command to send its run, if any. */
export interface TaskCancellation {
    readonly send?: TaskRunCommands;
    readonly settled: readonly TaskCall[];
    readonly table: TaskTable;
}
/**
 * Cancels a task's current work: its calls settle as cancelled and never
 * report back, and a live run is told to stop. A run that hasn't started
 * holds the cancel only for a non-agent resumable task. Cancelling an agent or
 * one-shot task ends it; another resumable task stays available and becomes idle.
 */
export declare function cancelTask(table: TaskTable, taskId: string): TaskCancellation;
/**
 * Hands every undelivered result to the model, which receives each
 * once: `taken` is each record with its results, before they were cleared.
 */
export declare function takeTaskResults(table: TaskTable): {
    readonly taken: readonly TaskRecord[];
    readonly table: TaskTable;
};
/** Why a task's current work was cancelled. */
export type TaskCancelReason = "task-cancel" | "turn-cancelled" | "turn-ended";
