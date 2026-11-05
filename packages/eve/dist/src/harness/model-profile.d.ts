import type { LanguageModel } from "ai";
import type { AgentPromptCacheDefinition, AnthropicPromptCacheTtl } from "#shared/agent-definition.js";
/**
 * What eve assumes about the model serving one call. Every decision that shapes a request for
 * its provider reads this record, so a step and its compaction agree about the model.
 */
export interface ModelProfile {
    /** Routed through AI Gateway, which caches automatically and serves Gateway tools. */
    readonly gateway: boolean;
    /**
     * Who serves the request: a Gateway id's vendor (`openai/gpt-5` → `openai`), which Gateway
     * translates for whichever host it routes to, otherwise the SDK provider's top-level name
     * (`anthropic`, `amazon-bedrock`, `vertex`, `azure`). It names the host, not the model family:
     * hosts of the same family accept different things (Bedrock and Vertex reject Anthropic's web
     * search tool), so a capability a host shares with its family gets its own flag, like
     * `anthropicCache`.
     */
    readonly provider: string;
    /** Takes Anthropic prompt-cache breakpoints, which live for `ttl`. */
    readonly anthropicCache: {
        readonly ttl: AnthropicPromptCacheTtl;
    } | undefined;
    /** Chat Completions APIs can't carry files in tool results, so they move to user messages. */
    readonly filesOutsideToolResults: boolean;
    /**
     * A Gemini model older than Gemini 3, which can't combine Google Search with function tools:
     * the request keeps the search and drops every other tool.
     */
    readonly googleSearchDropsTools: boolean;
}
/**
 * `promptCache` is the model's authored `modelOptions.promptCache`. It names the cache protocol
 * of a model whose provider and id don't, such as a Bedrock application inference profile.
 */
export declare function resolveModelProfile(model: LanguageModel, promptCache?: AgentPromptCacheDefinition): ModelProfile;
