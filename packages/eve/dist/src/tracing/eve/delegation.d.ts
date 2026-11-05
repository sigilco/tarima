import type { AgentSessionContext } from "#execution/agent-sessions/context.js";
import type { SessionParent, SessionTraceSeed } from "#channel/types.js";
export declare const agentDelegation: {
    fetch: typeof fetch;
    resume<T>(input: {
        context: Pick<AgentSessionContext, "trace" | "parent">;
        agentName: string;
    }, execute: () => T): T;
    receive<T>(input: {
        headers: Headers;
        delegated: boolean;
        trusted: boolean;
        parent?: SessionParent;
        callerTrace?: SessionTraceSeed;
        parentTraceContext?: SessionTraceSeed;
    }, execute: (context: {
        conversationId?: string;
        parentTraceContext?: SessionTraceSeed;
    }) => T): T;
};
