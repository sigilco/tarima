import type { MessageContent } from "#shared/message-content.js";
import type { DurableDynamicSubagentSelection } from "#context/keys.js";
import type { CompiledBundle } from "#runtime/sessions/runtime-context-keys.js";
import type { DynamicSubagentAgentConfig } from "#runtime/subagents/dynamic-agent-config.js";
import type { DynamicRemoteAgentConfig } from "#runtime/subagents/dynamic-remote-agent-config.js";
import type { RuntimeAgentDispatchRequest, RuntimeRemoteAgentDispatchRequest, RuntimeSubagentDispatchRequest } from "#shared/action-types.js";
import type { JsonObject } from "#shared/json.js";
import type { SubagentInputSource } from "#subagents/tool.js";
export type DynamicSubagentSelections = Readonly<Record<string, DurableDynamicSubagentSelection>>;
/** One message to an agent, addressed by its invocation name. */
export interface AgentActionInput {
    readonly message: MessageContent<string | URL>;
    readonly outputSchema?: JsonObject;
    readonly target: string;
}
/** Where a new session with an agent starts: in this deployment, or at a remote agent. */
export type SubagentStartTarget = {
    readonly kind: "local";
    readonly action: RuntimeSubagentDispatchRequest;
    readonly dynamicSubagentAgentConfig?: DynamicSubagentAgentConfig;
    readonly source: SubagentInputSource;
} | {
    readonly kind: "remote";
    readonly action: RuntimeRemoteAgentDispatchRequest;
    readonly dynamicRemoteAgent?: DynamicRemoteAgentConfig;
};
/**
 * Resolves an agent name against the calling agent's registry, its dynamic
 * selections, and the built-in root copy, as a dispatch request.
 */
export declare function resolveAgentAction(input: {
    readonly bundle: CompiledBundle;
    readonly callId: string;
    readonly dynamicSelections: DynamicSubagentSelections;
    readonly input: AgentActionInput;
}): RuntimeAgentDispatchRequest;
/**
 * Plans a fresh child for a dispatch request. A dynamic agent whose selection
 * changed and a root copy outside the root session can't start.
 */
export declare function resolveAgentStartTarget(input: {
    readonly action: RuntimeAgentDispatchRequest;
    readonly bundle: CompiledBundle;
    readonly dynamicSelections: DynamicSubagentSelections;
    readonly isRootSession: boolean;
}): SubagentStartTarget;
