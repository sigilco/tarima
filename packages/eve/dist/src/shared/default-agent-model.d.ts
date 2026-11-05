import type { AgentReasoningDefinition } from "./agent-definition.js";
/**
 * Model used when an agent does not declare one, baked in by `eve init`, and
 * pre-selected in the setup model picker.
 */
export declare const DEFAULT_AGENT_MODEL_ID = "openai/gpt-6-luna-fast";
export declare const DEFAULT_AGENT_REASONING = "high";
export declare function resolveInitAgentSettings(options: {
    model?: string;
    reasoning?: AgentReasoningDefinition;
}): {
    model: string;
    reasoning: AgentReasoningDefinition | undefined;
};
