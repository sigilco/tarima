import type { MessageContent } from "#shared/message-content.js";
import type { SessionAuthContext } from "#channel/types.js";
import type { ChannelFrom } from "#channel/channel-operations.js";
import type { AgentInvocation, AgentInvocationMutationResult } from "#internal/invocation/agent-invocation.js";
import type { RouteSessionCreator } from "#internal/nitro/routes/channel-route-context.js";
import { type Answer } from "#shared/input.js";
export declare class WorkflowAgentInvocationExecution {
    #private;
    constructor(input: {
        readonly createSession: RouteSessionCreator;
        readonly from: ChannelFrom;
    });
    create(input: {
        readonly auth: SessionAuthContext | null;
        readonly message: MessageContent;
    }): Promise<AgentInvocation>;
    read(input: {
        readonly auth: SessionAuthContext | null;
        readonly invocationId: string;
    }): Promise<AgentInvocation | undefined>;
    update(input: {
        readonly auth: SessionAuthContext | null;
        readonly invocationId: string;
        readonly responses: readonly Answer[];
    }): Promise<AgentInvocationMutationResult>;
    cancel(input: {
        readonly auth: SessionAuthContext | null;
        readonly invocationId: string;
    }): Promise<AgentInvocation | undefined>;
}
