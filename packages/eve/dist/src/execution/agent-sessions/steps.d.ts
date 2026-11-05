import type { MessageContent } from "#shared/message-content.js";
import type { SessionAuth } from "#context/session-context.js";
import type { AgentSessionContext } from "#execution/agent-sessions/context.js";
import type { JsonObject } from "#shared/json.js";
import type { DynamicRemoteBinding } from "#definitions/remote.js";
import type { AgentSessionModelSelection } from "#tools/workflow-definition.js";
/** Where a session a run opened lives, for its later sends, cancels, and end. */
export type AgentSessionAddress = {
    readonly kind: "local";
    readonly name: string;
    readonly nodeId: string;
    readonly sessionId: string;
    /** Names the session to whichever run holds its inbox. */
    readonly continuationToken: string;
} | {
    readonly callbackBaseUrl: string;
    readonly kind: "remote";
    readonly forwardPrincipal?: boolean;
    readonly name: string;
    readonly nodeId: string;
    /** Keys the authored credential functions, as on `child.opened`. */
    readonly resolverId?: string;
    /**
     * A dynamic remote agent's binding, which its credentials are built from again: the child
     * keeps the session it was opened with, whatever the parent's session becomes. Private.
     */
    readonly dynamicBinding?: DynamicRemoteBinding;
    readonly sessionId: string;
    readonly url: string;
    /** The child's remote agent protocol, when it speaks an earlier one than this deployment. */
    readonly earlierProtocol?: number;
};
/** A session a run opened, with the context of the call that opened it: its lineage. */
export interface OpenedAgentSession {
    readonly address: AgentSessionAddress;
    readonly context: AgentSessionContext;
    /** Names the session within its run, as when it opened. */
    readonly key: string;
}
/**
 * A message a session accepted. An earlier-protocol remote agent names no delivery, so
 * nothing records it.
 */
export interface AgentSessionReceipt {
    readonly sessionId: string;
    readonly deliveryId?: string;
}
/**
 * One message to a session, as the call that sends it: the session runs the
 * message with that call's auth. Its turn's result and questions arrive on
 * `replyTo`.
 */
export interface AgentSessionMessage {
    readonly auth: SessionAuth;
    readonly message: MessageContent<string | URL>;
    readonly outputSchema?: JsonObject;
    readonly replyTo: string;
}
/**
 * Opens a run's session with its first message, as a child of the call whose
 * `context` it binds. `key` names the handle within the run, so a retried step
 * reaches the same session instead of a second one.
 */
export declare function openAgentSessionStep(input: AgentSessionMessage & {
    readonly context: AgentSessionContext;
    readonly key: string;
    readonly model?: AgentSessionModelSelection;
    readonly name: string;
}): Promise<{
    readonly address: AgentSessionAddress;
    readonly deliveryId?: string;
}>;
/**
 * Sends a later message; it joins the session's running turn or starts the
 * next. It keeps the session's lineage and carries its own auth.
 */
export declare function sendAgentSessionMessageStep(input: AgentSessionMessage & OpenedAgentSession): Promise<AgentSessionReceipt>;
/** Cancels a session's running turn; the turn still reports, as cancelled. */
export declare function cancelAgentSessionTurnStep(input: OpenedAgentSession): Promise<void>;
/** Ends a run's sessions when the run finishes, cancelling any turn still running. */
export declare function endAgentSessionsStep(input: {
    readonly sessions: readonly OpenedAgentSession[];
}): Promise<void>;
/** Best-effort cleanup for a late address whose cancelled run cannot own it. */
export declare function stopLateAgentSessionStep(opened: OpenedAgentSession): Promise<void>;
