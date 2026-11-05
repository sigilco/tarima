import type { AgentReasoningDefinition, AgentStaticModelDefinition } from "#public/index.js";
export declare const DEPLOYED_OPTION_MOVED_MESSAGE = "The `deployed` option moved to the separate `eve/extensions/self-modification/remote` mount. Remove it from this local self-modification mount and mount `eve/extensions/self-modification/remote` instead.";
/** Local self-modification settings shared by its bundled child and sandbox. */
export interface SelfModificationConfig {
    readonly local?: {
        readonly enabled?: boolean;
    };
}
/** Values accepted by the local self-modification extension mount. */
export interface SelfModificationExtensionConfig extends SelfModificationConfig {
    readonly model?: AgentStaticModelDefinition;
    readonly reasoning?: AgentReasoningDefinition;
}
export interface ResolvedSelfModificationConfig {
    readonly localEnabled: boolean;
}
/** Defines the local self-modification policy. */
export declare function defineSelfModificationConfig(config?: SelfModificationConfig): SelfModificationConfig;
export declare function resolveSelfModificationConfig(config?: SelfModificationConfig): ResolvedSelfModificationConfig;
