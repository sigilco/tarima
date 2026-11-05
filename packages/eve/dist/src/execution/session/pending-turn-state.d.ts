import type { TaskToolCall } from "#execution/tasks/calls.js";
import type { HarnessSession } from "#harness/types.js";
import type { SessionProjection } from "#protocol/session-projection.js";
/**
 * What a paused turn waits on, which is one kind of thing at a time. The turn keeps it to resume;
 * the stream reports the pause as `turn.paused`.
 */
export type TurnPause = 
/** Sign-ins whose callbacks resume the turn, and open questions and approvals. */
{
    readonly on: "interaction";
    readonly attemptIds: readonly string[];
    readonly requestIds: readonly string[];
}
/** Working tasks. Any of them settling resumes the turn. */
 | {
    readonly on: "tasks";
    readonly taskIds: readonly string[];
}
/**
 * Calls whose results resume the turn, task tool calls included. `dispatch` starts their
 * workflow tool runs before the wait; the session answers `taskToolCalls` itself.
 */
 | {
    readonly on: "calls";
    readonly callIds: readonly string[];
    readonly dispatch: boolean;
    readonly taskToolCalls: readonly TaskToolCall[];
};
/** The turn waits on sign-ins and answers to its interactions. */
export declare function pausedOnInteraction(session: HarnessSession, projection: SessionProjection): TurnPause;
/** The model ended the turn while tasks work, so the turn waits for one of them. */
export declare function pausedOnTasks(taskIds: readonly string[]): TurnPause;
/** The turn waits on calls the runtime runs, or on none. */
export declare function pausedOnCalls(session: HarnessSession): TurnPause | undefined;
/** Whether the turn waits on a sign-in, an answer, or a call, which ends a batch of model calls. */
export declare function waitsOnAnything(session: HarnessSession, projection: SessionProjection): boolean;
