import type { DynamicRemoteBinding } from "#definitions/remote.js";
import type { RemoteAgentCredentials } from "#runtime/subagents/dynamic-remote-agent-config.js";
import type { ResolvedDynamicSubagentResolver } from "#runtime/subagents/registry.js";
/**
 * Builds a dynamic remote agent's credentials from the binding its child was opened with: the
 * definition runs again with the session as the binding holds it, and memos return the bound
 * results without running. The destination it returns must be the one the child was opened at,
 * or the request fails rather than send credentials elsewhere.
 */
export declare function remoteAgentCredentials(input: {
    readonly resolvers: readonly ResolvedDynamicSubagentResolver[];
    readonly nodeId: string;
    readonly binding: DynamicRemoteBinding | undefined;
    readonly destination: {
        readonly name: string;
        readonly url: string;
    };
    readonly abortSignal?: AbortSignal;
}): Promise<RemoteAgentCredentials>;
