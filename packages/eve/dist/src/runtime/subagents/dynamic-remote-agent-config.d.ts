import type { HeadersValue } from "#client/types.js";
import type { OutboundAuthFn } from "#public/agents/auth.js";
import type { AgentToolExposure } from "#shared/agent-definition.js";
/** A dynamic remote agent as the session records it: JSON, without its credentials. */
export interface DynamicRemoteAgentConfig {
    readonly description: string;
    readonly forwardPrincipal?: boolean;
    readonly path: string;
    readonly tool?: AgentToolExposure;
    readonly url: string;
    /** It carries `auth` or `headers`, which are code: they're rendered from its record. */
    readonly credentials?: true;
}
/** A dynamic remote agent's `auth` and `headers`, which its `render` creates. */
export interface RemoteAgentCredentials {
    readonly auth?: OutboundAuthFn;
    readonly headers?: HeadersValue;
}
/** Normalizes what a dynamic subagent returned for a remote agent: its config, and credentials. */
export declare function normalizeDynamicRemoteAgent(input: {
    readonly name: string;
    readonly value: unknown;
}): Promise<{
    readonly config: DynamicRemoteAgentConfig;
    readonly credentials?: RemoteAgentCredentials;
}>;
