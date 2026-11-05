import { type SessionStepState } from "#execution/publish-session-events.js";
import { type SessionStateTransition } from "#execution/session/state-delta.js";
import { type TaskRunMessage } from "#execution/tasks/steps.js";
import type { WorkflowToolRunMessage } from "#execution/tools/workflow/messages.js";
/** A run's message the session applies as it reads it, which answers no call a turn waits on. */
export type AppliedRunMessage = Extract<WorkflowToolRunMessage, {
    readonly kind: "agent-started" | "agent-sent" | "report";
}> | (TaskRunMessage & {
    readonly from: {
        readonly taskId: string;
    };
});
/**
 * Applies run messages in the order they arrived, in one step however many
 * there are: a fan-out's starts, reports, and replies would otherwise cost a
 * step each. Set `canCancelTurn` while a turn runs: a hook's `ctx.cancel()`
 * on a report then returns `cancelled` for the turn to stop.
 */
export declare function applyRunMessagesStep(input: SessionStepState & {
    readonly canCancelTurn?: boolean;
    readonly messages: readonly AppliedRunMessage[];
}): Promise<SessionStateTransition & {
    readonly cancelled: boolean;
}>;
