/** Starts workflow-tool runs for pending coordination, then publishes the calls it started. */
import { type CoordinationDispatchInput, type CoordinationDispatchResult } from "#execution/coordination-dispatch-shared.js";
import { type SessionStepState } from "#execution/publish-session-events.js";
import { type SessionStateTransition, type WithSessionStateDelta } from "#execution/session/state-delta.js";
import { type PendingDispatch } from "#harness/session-machine/transitions.js";
/**
 * Starts the runs of the pending calls and records them on the session. A
 * retry starts its runs again, since a Workflow start has no idempotency key,
 * so this step publishes nothing and commits as soon as the runs are
 * recorded. See {@link publishDispatchedCallsStep}.
 */
export declare function dispatchCoordinationStep(input: CoordinationDispatchInput): Promise<WithSessionStateDelta<CoordinationDispatchResult>>;
/**
 * Publishes, as one commit, what {@link dispatchCoordinationStep} recorded: the calls the turn
 * waits on started, the tasks it started or reached, and the calls it refused. Run ownership is
 * checkpointed first, so retrying the publication cannot start those runs again.
 */
export declare function publishDispatchedCallsStep(input: SessionStepState & {
    readonly pending: PendingDispatch;
}): Promise<SessionStateTransition>;
