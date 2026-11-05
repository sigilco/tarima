import type { PreparedRuntimeDelegationTool } from "#runtime/sessions/turn.js";
import type { ResolvedDynamicSubagentDefinition, ResolvedRuntimeDelegationNode } from "#runtime/types.js";
import type { JsonObject } from "#shared/json.js";
import type { AgentToolExposure } from "#shared/agent-definition.js";
/**
 * One runtime-owned subagent tracked by the prepared registry.
 */
interface RuntimeRegisteredSubagent {
    readonly definition: ResolvedRuntimeDelegationNode;
    readonly prepared?: PreparedRuntimeDelegationTool;
}
export interface ResolvedDynamicSubagentResolver extends ResolvedDynamicSubagentDefinition {
    readonly kind: "subagent";
    readonly name: string;
    readonly nodeId: string;
    readonly tool?: AgentToolExposure;
}
/**
 * Runtime-owned registry that keeps all resolved subagents addressable while
 * preparing only their selected model-tool projections.
 */
export interface RuntimeSubagentRegistry {
    readonly dynamicNodeIds: ReadonlySet<string>;
    readonly dynamicResolvers: readonly ResolvedDynamicSubagentResolver[];
    readonly preparedTools: readonly PreparedRuntimeDelegationTool[];
    readonly subagentsByName: ReadonlyMap<string, RuntimeRegisteredSubagent>;
    readonly subagentsByNodeId: ReadonlyMap<string, RuntimeRegisteredSubagent>;
}
/**
 * Builds the runtime-owned registry for the resolved subagents owned by one
 * runtime agent node.
 */
export declare function createRuntimeSubagentRegistry(input: {
    readonly disabledToolNames?: readonly string[];
    readonly reservedToolNames?: readonly string[];
    readonly subagents: readonly ResolvedRuntimeDelegationNode[];
}): RuntimeSubagentRegistry;
export declare function createPreparedRuntimeSubagentTool(definition: ResolvedRuntimeDelegationNode, inputSchema?: JsonObject): PreparedRuntimeDelegationTool;
export {};
