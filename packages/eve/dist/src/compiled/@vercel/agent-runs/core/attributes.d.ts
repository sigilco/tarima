import type { Attributes, FrameworkIdentity, RunIdentity, Usage } from "./types.js";
export declare const USAGE_FIELDS: {
    readonly costUsd: "agent.usage.cost_usd";
    readonly inputTokens: "agent.usage.input_tokens";
    readonly outputTokens: "agent.usage.output_tokens";
    readonly cacheReadTokens: "agent.usage.cache_read_tokens";
    readonly cacheWriteTokens: "agent.usage.cache_write_tokens";
};
export declare function identityAttributes(identity: Pick<RunIdentity, "runId" | "conversationId">): Attributes;
export declare function namingAttributes(name: string, operation?: string): Attributes;
export declare function frameworkAttributes(framework?: FrameworkIdentity): Attributes;
/** Invocation and model spans use GenAI token counts; structural spans use eve's. */
export declare function usageAttributes(usage: Usage, genAi?: boolean): Attributes;
export declare function runtimeContextAttributes(input: Readonly<Record<string, unknown>> | undefined): Attributes;
