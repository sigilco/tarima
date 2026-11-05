import type { EveMessage } from "#client/message-types.js";
import type { DeliveryOutcome } from "#protocol/session-events/families/delivery.js";
import type { CallRow, DeliveryRow, TaskRow } from "#protocol/session-projection/tables.js";
import { type SessionView } from "#protocol/session-projection/session-view.js";
export interface FollowedChild {
    /** Root depth is zero; its immediate children have depth one. */
    readonly depth: number;
    readonly name: string;
    readonly sessionId: string;
    readonly owner: {
        readonly callId: string;
    } | {
        readonly taskId: string;
    };
}
/** A synchronous selection policy, evaluated once per relationship at each known reachable depth. */
export type FollowAgents = boolean | ((child: FollowedChild) => boolean);
export type AgentObservationReason = "predicate" | "depth-limit" | "session-limit" | "cycle" | "unauthorized" | "expired" | "unsupported" | "transport" | "detached";
export type AgentObservation = {
    readonly status: "not-followed";
    readonly reason?: AgentObservationReason;
} | {
    readonly status: "queued" | "following" | "caught-up" | "interrupted" | "unavailable";
    /** Identity in this store's authorized reader scope, established by the server. */
    readonly key?: string;
    readonly conversation: ConversationState;
    /** Committed source-line position, coherent with conversation. */
    readonly position: number;
    /** Reached the tail captured when this read opened, not execution completion. */
    readonly caughtUp: boolean;
    readonly reason?: AgentObservationReason;
};
/** A child session linked by the root's `child.opened`, with its independent observation state. */
export interface ConversationAgentSession {
    readonly sessionId: string;
    readonly name: string;
    readonly owner: FollowedChild["owner"];
    readonly callId?: string;
    readonly turnId?: string;
    readonly taskId?: string;
    readonly observation: AgentObservation;
}
/** Immutable lifecycle observations, with renderable messages and local answers. */
export interface ConversationState {
    readonly view: SessionView;
    readonly messages: readonly EveMessage[];
    readonly agents: Readonly<Record<string, ConversationAgentSession>>;
}
export declare function agentToolTask(state: ConversationState, agent: ConversationAgentSession): TaskRow | undefined;
export declare function agentToolSession(state: ConversationState, task: TaskRow): ConversationAgentSession | undefined;
/** Direct model calls served by this task, in call order. */
export declare function taskCalls(view: SessionView, taskId: string): readonly CallRow[];
/** A delivery a call sent, as this reader has seen it on the child's stream. */
export interface AgentCallDelivery {
    readonly deliveryId: string;
    /** `unseen` until this reader reads the child's admission, including when it follows none. */
    readonly status: "unseen" | DeliveryRow["status"];
    /** The child turn that consumed it. */
    readonly turnId?: string;
    readonly outcome?: DeliveryOutcome;
}
/** One child session's part in a call: what the call sent it, and the turns that read it. */
export interface AgentCallSession {
    readonly sessionId: string;
    readonly deliveries: readonly AgentCallDelivery[];
    /**
     * Child turns that consumed the call's deliveries, oldest first. `sharedWith` names the other
     * calls whose deliveries the same turn consumed, so its content answers them together.
     */
    readonly turns: readonly {
        readonly turnId: string;
        readonly sharedWith: readonly string[];
    }[];
}
/**
 * The child activity a call caused, from the `child.sent` links its session recorded: `unlinked`
 * when it recorded none, as for a call that sent nothing or reached an earlier-protocol remote
 * agent.
 */
export type AgentCallActivity = {
    readonly status: "unlinked";
} | {
    readonly status: "linked";
    readonly sessions: readonly AgentCallSession[];
};
export declare function agentCallActivity(state: ConversationState, callId: string): AgentCallActivity;
