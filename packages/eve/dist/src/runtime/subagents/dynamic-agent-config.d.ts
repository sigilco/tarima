import type { ContextAccessor } from "#context/key.js";
import type { RuntimeModelReference } from "#runtime/agent/bootstrap.js";
import type { ModelMetadata } from "#internal/model-catalog.js";
import { type AgentLimitsDefinition, type AgentReasoningDefinition, type AgentToolExposure } from "#shared/agent-definition.js";
export interface DynamicSubagentAgentConfig {
    readonly compaction?: {
        readonly model?: DynamicSubagentModelReference;
        readonly thresholdPercent?: number;
    };
    readonly description: string;
    /** Serialized into workflow input, so it can't carry the `sessionUsage` function. */
    readonly limits?: Pick<AgentLimitsDefinition, "sessionTimeoutMs">;
    readonly model: DynamicSubagentModelReference;
    readonly reasoning?: AgentReasoningDefinition;
    readonly tool?: AgentToolExposure;
}
export type DynamicSubagentModelReference = RuntimeModelReference;
export declare function normalizeDynamicSubagentAgentConfig(input: {
    readonly modelMetadata: () => Promise<ModelMetadata>;
    readonly name: string;
    readonly state: ContextAccessor;
    readonly value: unknown;
}): Promise<DynamicSubagentAgentConfig>;
