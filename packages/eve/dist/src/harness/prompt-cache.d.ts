import type { ModelMessage, SystemModelMessage, ToolSet } from "ai";
import type { ModelProfile } from "#harness/model-profile.js";
type AnthropicCache = NonNullable<ModelProfile["anthropicCache"]>;
/**
 * Returns a new `providerOptions` object with
 * `gateway.caching = "auto"` merged into the existing `gateway` sub-object.
 *
 * Preserves any existing author-provided `gateway` keys (such as
 * `order: ["anthropic", "bedrock"]` load balancing), and leaves an
 * explicit author override on `gateway.caching` untouched so callers can
 * opt out by setting `providerOptions.gateway.caching` to `false` or
 * another value.
 */
export declare function mergeGatewayAutoCaching(base: Readonly<Record<string, unknown>> | undefined): Record<string, unknown>;
/**
 * Returns a new ToolSet where the last tool entry carries the Anthropic
 * cache marker on `providerOptions`. Used for Anthropic-cache models
 * to place a stable breakpoint at the end of the tools block, caching the
 * full tool definitions across every turn.
 *
 * No-op when `tools` has no entries. Preserves existing `providerOptions`
 * on tools (merges the cache marker in via spread).
 */
export declare function applyLastToolCacheBreakpoint(tools: ToolSet, cache: AnthropicCache): ToolSet;
/**
 * Marks the last system message in an instructions array with the Anthropic
 * cache marker. This creates a cache breakpoint at the end of the system
 * prompt, preserving the system prefix when tools change between steps.
 *
 * When `instructions` is a string or undefined, returns it unchanged —
 * single-string system prompts don't support per-message providerOptions.
 * No-op when the array is empty.
 */
export declare function applySystemCacheBreakpoint(instructions: readonly SystemModelMessage[], cache: AnthropicCache): SystemModelMessage[];
/**
 * Attaches the Anthropic cache marker to the last message in `messages`
 * (whatever its role) and, as a stable mid-history anchor, to the most
 * recent `assistant` message before it. Returns a new array; does not
 * mutate the input.
 *
 * The final breakpoint must sit on the very last message so that the
 * newest content — typically a `tool` message carrying fresh tool
 * results — is written to the cache in the same request that pays for
 * it. Placing it any earlier (e.g. on the last assistant message) leaves
 * the trailing tool results outside the cached region: they get billed
 * as uncached input every turn and only enter the cache one request
 * later, capping the effective hit rate near 50%. The AI SDK Anthropic
 * provider maps a message-level marker on a `tool` message to its last
 * tool-result content block.
 *
 * The assistant anchor implements "automatic cache advancement": it
 * guarantees a breakpoint from the prior request survives into the next
 * one, so cache lookups always find the previous prefix even when a step
 * appends more content blocks than Anthropic's backward boundary scan
 * covers.
 */
export declare function applyConversationCacheControl(messages: readonly ModelMessage[], cache: AnthropicCache): ModelMessage[];
export {};
