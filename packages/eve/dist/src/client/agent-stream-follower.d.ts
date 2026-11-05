import type { ClientSession } from "#client/session.js";
import { Conversation } from "#client/conversation.js";
import type { FollowAgents } from "#client/conversation-state.js";
/** One bounded scheduler and projection registry for the root's entire observed descendant graph. */
export declare class AgentStreamFollower {
    #private;
    constructor(options: {
        session: ClientSession;
        conversation: Conversation;
        policy: FollowAgents;
        onChange: () => void;
    });
    start(): void;
    /** Discovery sees committed projections, never a partially received opening. */
    reconcile(): void;
    abortAll(): void;
}
