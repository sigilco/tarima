import { type TaskRunCommands } from "#execution/tasks/table.js";
import type { PublishedSessionEvents, SessionStepState } from "#execution/publish-session-events.js";
import { type SessionStateTransition } from "#execution/session/state-delta.js";
import type { WorkflowToolRunMessage } from "#execution/tools/workflow/messages.js";
import type { TaskCancelReason } from "#execution/tasks/table.js";
/** The messages a task's run sends that change its record. */
export type TaskRunMessage = Extract<WorkflowToolRunMessage, {
    readonly kind: "outcome" | "reply" | "started" | "usage";
}>;
/**
 * Applies one message from a task's run: started, a reply, usage no reply
 * carried, or the run's outcome. Call from a step and adopt the result.
 */
export declare function applyTaskRunMessage(input: SessionStepState & {
    readonly message: TaskRunMessage;
}): Promise<PublishedSessionEvents>;
/**
 * Cancels tasks, and the calls the turn waits on when `turnCalls` is set. The tasks' calls
 * settle as cancelled and the session publishes that first. A cancelled agent or `task()` task
 * ends now, without waiting for its run to finish cleanup. A resumable tool's run only stops its
 * current stretch.
 *
 * A `task()` run's cancel settles every request it relayed, so the session withdraws them in
 * the same step and accepts no answer after it. A `serve()` run withdraws its stretch's
 * questions itself, and the session decides each one.
 */
export declare function cancelTasksStep(input: SessionStepState & TaskCancellationInput): Promise<SessionStateTransition>;
interface TaskCancellationInput {
    readonly reason: TaskCancelReason;
    readonly taskIds: readonly string[];
    /** Also stop the workflow tool runs the turn waits on. */
    readonly turnCalls?: boolean;
}
/**
 * Sends commands to a task's run, in order. A run that already finished takes
 * none; its outcome settles any call still waiting.
 */
export declare function sendTaskRunCommands(commands: TaskRunCommands): Promise<void>;
export {};
