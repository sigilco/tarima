import type { ModelMessage } from "ai";
/**
 * Converts provider-executed tool outcomes into replay-safe model messages.
 *
 * Provider SDKs can return a tool call and its result inside one assistant
 * message. Each matching call is rewritten as a normal call and consecutive
 * results are moved into a tool message at their original position when the
 * call lacks the matching marker or shares an assistant message with a local
 * tool call. Native provider-only call/result pairs stay in the assistant
 * message, but content after their results starts a new assistant message:
 * AI Gateway replays a single message with a result followed by text as if
 * the text came first. Text before a result remains before it; text after a
 * result remains after it. Local tool calls in a split message, with their
 * approval requests, move to its last assistant message, so the local results
 * that follow the response directly follow their calls.
 */
export declare function normalizeProviderToolHistory(input: {
    readonly messages: readonly ModelMessage[];
    readonly providerExecutedOutcomeIds: ReadonlySet<string>;
}): {
    readonly messages: ModelMessage[];
    readonly outcomeEndsResponse: boolean;
};
/**
 * Whether `messages` end on local tool results while a provider tool called beside them still
 * runs. Anthropic defers that call until the local results arrive, and its result opens the next
 * response, so a request must end on those results: anything after them ends the turn early.
 */
export declare function awaitsProviderToolResult(messages: readonly ModelMessage[]): boolean;
/** The provider calls whose results `messages` end waiting on, as {@link awaitsProviderToolResult}. */
export declare function awaitedProviderToolCallIds(messages: readonly ModelMessage[]): ReadonlySet<string>;
