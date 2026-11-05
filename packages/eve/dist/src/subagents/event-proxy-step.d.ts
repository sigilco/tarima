import type { SubagentInteractionHookPayload } from "#channel/types.js";
import { type PublishedSessionEvents, type RestoredSessionStep, type SessionStepState } from "#execution/publish-session-events.js";
import { type SessionStateTransition } from "#execution/session/state-delta.js";
import type { WorkflowAskRoute } from "#harness/hitl/relays.js";
/** Relays one child interaction fact through its parent channel across a durable step boundary. */
export declare function runProxySubagentEventStep(input: SessionStepState & {
    readonly workflowAsk?: WorkflowAskRoute;
    readonly runId?: string;
    readonly hookPayload: SubagentInteractionHookPayload;
}): Promise<SessionStateTransition>;
/**
 * Relays one child interaction fact through the parent session's channel. `runId` names the
 * workflow tool run that relayed it, so the session can withdraw its requests when that run ends.
 */
export declare function emitProxiedSubagentEvent(input: RestoredSessionStep & {
    readonly workflowAsk?: WorkflowAskRoute;
    readonly runId?: string;
    readonly hookPayload: SubagentInteractionHookPayload;
}): Promise<PublishedSessionEvents>;
