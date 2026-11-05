/** Offers the deployed self-modification child only to authorized principals outside `eve dev`. */
declare const _default: import("eve").DynamicSentinel<import("eve").DefinedAgent<{
    description: string;
    model: import("eve").AgentStaticModelDefinition;
    reasoning: import("eve").AgentReasoningDefinition | undefined;
}> | null, import("eve").DynamicContext>;
export default _default;
