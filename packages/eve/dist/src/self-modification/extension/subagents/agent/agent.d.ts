import { type AgentReasoningDefinition, type AgentStaticModelDefinition } from "eve";
import { type SelfModificationConfig } from "../../../config.js";
/** Fallback model when neither the self-modification agent nor its parent configures one. */
export declare const FALLBACK_SELF_MODIFICATION_MODEL = "openai/gpt-6-luna-fast";
/** Configuration for the self-modification subagent. */
export interface SelfModificationAgentOptions {
    /** Policy shared with the sandbox and extension mount. */
    readonly config?: SelfModificationConfig;
    /** Model used by the self-modification subagent; defaults to the effective parent model. */
    readonly model?: AgentStaticModelDefinition;
    /**
     * Reasoning effort used by the self-modification subagent.
     */
    readonly reasoning?: AgentReasoningDefinition;
}
/**
 * Defines the local development self-modification dynamic subagent, offered
 * only to the developer running `eve dev` (see {@link isLocalDeveloper}).
 */
export declare function defineSelfModificationAgent(options?: SelfModificationAgentOptions): import("eve").DynamicSentinel<import("eve").DefinedAgent<{
    description: string;
    model: AgentStaticModelDefinition;
    reasoning: AgentReasoningDefinition | undefined;
}> | null, import("eve").DynamicContext>;
declare const _default: import("eve").DynamicSentinel<import("eve").DefinedAgent<{
    description: string;
    model: AgentStaticModelDefinition;
    reasoning: AgentReasoningDefinition | undefined;
}> | null, import("eve").DynamicContext>;
export default _default;
