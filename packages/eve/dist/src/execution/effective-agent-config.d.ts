import type { ContextReader } from "#context/key.js";
import type { RuntimeModelReference } from "#runtime/agent/bootstrap.js";
import type { ApprovalPolicy } from "#approval/definition.js";
import { type CompiledBundle } from "#runtime/sessions/runtime-context-keys.js";
import type { AgentLimitsDefinition, AgentReasoningDefinition, SessionUsageLimit } from "#shared/agent-definition.js";
/** What the agent sets for every model call, whichever model it runs. */
export interface AgentSettings {
    readonly compactionModel?: RuntimeModelReference;
    readonly reasoning?: AgentReasoningDefinition;
    readonly thresholdPercent?: number;
}
/** The settings of the agent the step runs: `agent.ts`'s, or a dynamic subagent config's. */
export declare function agentSettings(step: {
    readonly ctx: Pick<ContextReader, "get" | "require">;
}): AgentSettings;
/** The session's limits: a dynamic subagent config's, else `agent.ts`'s. */
export declare function agentLimits(bundle: Pick<CompiledBundle, "resolvedAgent">, ctx: Pick<ContextReader, "get">): Pick<AgentLimitsDefinition, "sessionTimeoutMs"> | undefined;
/**
 * The session's `limits.sessionUsage`: the agent's own, else the root agent's.
 * A dynamic subagent config can't carry one, so its sessions run the root's.
 */
export declare function resolveSessionUsageLimit(bundle: Pick<CompiledBundle, "graph" | "resolvedAgent">): SessionUsageLimit | undefined;
/**
 * The session's agent-wide `approval`. The root agent's always applies, including in subagent
 * sessions; a subagent's own can only add to it, so no subagent (an extension's included) can
 * loosen the root's gates.
 */
export declare function resolveAgentApproval(bundle: Pick<CompiledBundle, "graph" | "nodeId" | "resolvedAgent">): ApprovalPolicy | undefined;
