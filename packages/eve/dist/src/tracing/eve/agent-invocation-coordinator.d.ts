import type { SessionTraceSeed } from "#channel/types.js";
import type { ChannelAudience } from "#shared/channel-audience.js";
import type { ConversationContext } from "#shared/conversation-context.js";
export interface AgentChildTraceDispatch {
    readonly conversationId?: string;
    readonly originAudience: ChannelAudience;
    readonly parentTraceContext?: SessionTraceSeed;
}
/**
 * The trace dispatch for sessions opened with `ctx.agent` while a run serves
 * one workflow tool call: the call's tool span in the calling turn, read from
 * the calling session when it admits the call.
 */
export declare function resolveToolCallAgentTrace(input: {
    readonly callId: string;
    readonly conversation?: ConversationContext;
    readonly serializedContext: Record<string, unknown>;
    readonly sessionId: string;
    readonly turnId: string;
}): AgentChildTraceDispatch;
