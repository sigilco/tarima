import type { PublishedSessionEvents, SessionStepState } from "#execution/publish-session-events.js";
import { type SessionStateTransition } from "#execution/session/state-delta.js";
import type { Relay } from "#harness/hitl/relays.js";
/**
 * Decides a run's request to withdraw a question. A question the session
 * still offers is withdrawn, so channels stop offering it. One it no longer
 * offers was already answered or withdrawn when its turn was cancelled. Either
 * way the run hears `withdrawn`, after any answer the session sent it first, so
 * the question resolves from the session's first decision.
 */
export declare function withdrawWorkflowToolRunQuestionStep(input: WithdrawQuestionInput): Promise<SessionStateTransition>;
type WithdrawQuestionInput = SessionStepState & {
    readonly control: string;
    readonly requestId: string;
    readonly runId: string;
};
/**
 * Withdraws the requests a finished run left open: its own questions and those
 * of the sessions it opened, which ended with it. Nobody can answer them now.
 */
export declare function withdrawFinishedRunQuestionsStep(input: SessionStepState & {
    readonly runId: string;
}): Promise<SessionStateTransition>;
/**
 * Withdraws the relayed requests `select` picks through the machine's `finishRun`, for a step
 * that owns the session. Their routes drop with the save, once the projection shows them closed.
 */
export declare function relayWithdrawnRequests(input: SessionStepState, select: (requestId: string, route: Relay) => boolean): Promise<PublishedSessionEvents>;
export {};
