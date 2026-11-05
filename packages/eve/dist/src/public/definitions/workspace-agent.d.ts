import type { HeadersValue } from "#client/types.js";
import { type OutboundAuthFn } from "#public/agents/auth.js";
import { type RemoteAgentDefinition, type RemoteAgentUrl } from "#public/definitions/remote-agent.js";
import type { AgentToolExposure } from "#shared/agent-definition.js";
/** Runtime transport for one workspace peer. */
export interface WorkspaceAgentTransport {
    readonly auth?: OutboundAuthFn;
    readonly headers?: HeadersValue;
    readonly url: RemoteAgentUrl;
}
/** A workspace peer exposed as one remote subagent. */
export interface WorkspaceAgentDefinition {
    /** Overrides the peer agent's description in the parent's tool definition. */
    readonly description?: string;
    readonly forwardPrincipal?: boolean;
    /** Name of the peer workspace member, such as `research`. */
    readonly name: string;
    /**
     * How eve exposes this workspace peer to the parent model: `true` lists it
     * as a tool, `"deferred"` makes it a catalog entry the model finds with
     * `eve__search` and calls with `eve__tool`, and `false` keeps it callable only from
     * workflow tools. Defaults to `true`.
     */
    readonly tool?: AgentToolExposure;
    /** Overrides environment-aware workspace routing and service authentication. */
    readonly transport?: WorkspaceAgentTransport;
}
/** Defines one workspace peer as a remote subagent. */
export declare function defineWorkspaceAgent(definition: WorkspaceAgentDefinition): RemoteAgentDefinition;
export declare function workspaceSubagentName(value: unknown): string | undefined;
