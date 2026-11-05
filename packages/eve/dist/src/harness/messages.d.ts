import type { ModelMessage, UserContent } from "ai";
import type { MessageContent } from "#shared/message-content.js";
import type { ChannelDeliveryMetadataEntry, DeliverPayload, SessionAuthContext, TurnCaller } from "#channel/types.js";
import type { Answer } from "#shared/input.js";
import type { HarnessStepInput } from "#harness/types.js";
import type { SessionHistoryMessage } from "#shared/session-history.js";
/** Reason a framework-authored user-role message was added to model history. */
export type FrameworkMessageKind = "context.instruction" | "context.state" | "context.compaction" | "memory.load" | "execution.continuation" | "execution.retry" | "task.result";
/** Semantic classification for every user-role message in model history. */
export type UserMessageKind = "user" | FrameworkMessageKind;
/** A user-role message that is safe to retain in framework model history. */
export type UserModelMessage = Extract<ModelMessage, {
    readonly role: "user";
}> & {
    readonly kind: UserMessageKind;
    readonly metadata?: Record<string, unknown>;
};
/** Model message shape retained in framework history. */
export type HarnessModelMessage = Exclude<ModelMessage, {
    readonly role: "user";
}> | UserModelMessage;
type FrameworkUserMessage = UserModelMessage & {
    readonly kind: FrameworkMessageKind;
};
/** Builds a classified user-role message for model history. */
export declare function createUserMessage(kind: FrameworkMessageKind, content: UserContent, metadata?: Record<string, unknown>): FrameworkUserMessage;
export declare function createUserMessage(kind: "user", content: UserContent, metadata?: Record<string, unknown>): UserModelMessage;
/** Metadata key marking a user message seeded from `history` rather than typed in a turn. */
export declare const IMPORTED_MESSAGE_METADATA_KEY = "eve.imported";
/** Maps seeded history to model messages: plain user and assistant text, nothing else. */
export declare function createImportedHistoryMessages(history: readonly SessionHistoryMessage[]): HarnessModelMessage[];
/** Builds a framework-authored user-role message for model history. */
export declare function createFrameworkUserMessage(kind: FrameworkMessageKind, content: UserContent, metadata?: Record<string, unknown>): FrameworkUserMessage;
/** Marks a turn's input message, so what eve adds for that turn can sit just ahead of it. */
export declare function anchorToTurn<T extends UserModelMessage>(message: T, turnId: string): T;
/** The turn whose input brought a message into history, when it's marked. */
export declare function turnAnchorOf(message: HarnessModelMessage): string | undefined;
/** True when a value is a recognized classification for a user-role message. */
export declare function isUserMessageKind(value: unknown): value is UserMessageKind;
/** True when a user-role model message has the required semantic classification. */
export declare function isUserModelMessage(message: ModelMessage): message is UserModelMessage;
/** True when a user-role message was authored by the framework. */
export declare function isFrameworkUserMessage(message: ModelMessage): message is FrameworkUserMessage;
/** Validates that every user-role message is classified before history retains it. */
export declare function validateHarnessModelMessages(messages: readonly ModelMessage[]): HarnessModelMessage[];
export declare function isFrameworkMessageKind(value: unknown): value is FrameworkMessageKind;
/** Marks an execution-owned delivery so its model message retains provenance. */
export declare function markFrameworkStepInput<T extends object>(input: T, kind: FrameworkMessageKind): T;
/** Returns the framework reason for an execution-owned user message, when present. */
export declare function frameworkMessageKindForStepInput(input: object | undefined): FrameworkMessageKind | undefined;
/** A turn's input as a channel payload or the harness carries it. */
type TurnInput = Omit<HarnessStepInput, "answers"> & {
    readonly answers?: readonly Answer[];
};
/**
 * Merges two turn inputs into one: deferred step input with the current turn's, or the inputs
 * `deliver` made of a delivery's payloads.
 */
export declare function coalesceTurnInputs<T extends TurnInput>(a: T, b: T): T;
/**
 * Removes text parts with no model-visible content from a user message.
 *
 * Returns `undefined` when no parts remain, allowing callers to omit the user
 * turn entirely rather than create an empty model prompt block.
 */
export declare function normalizeMessage(content: MessageContent | undefined): MessageContent | undefined;
/**
 * Model-only assistant text between tool results and a person's next message.
 * Without it, providers such as Anthropic fold the message into the user turn
 * that carries the tool results, and the model reads it as tool output: it
 * continues its plan instead of answering.
 */
export declare const TOOL_RESULT_BOUNDARY = "\u2026";
/** Whether a user message appended to `messages` would share a turn with tool results. */
export declare function followsToolResults(messages: readonly ModelMessage[]): boolean;
/** Removes blank text blocks that some providers reject from model-bound history. */
export declare function normalizeModelMessages(messages: readonly ModelMessage[]): ModelMessage[];
/**
 * Extracts the final visible assistant text from model response messages.
 *
 * Prefers text extracted from the last assistant message that contains visible
 * text. Falls back to the raw `text` property from the AI SDK result when no
 * assistant message contains text. Returns `null` when neither source contains
 * text.
 */
export declare function resolveAssistantStepText(messages: readonly ModelMessage[], fallback: string | undefined): string | null;
/**
 * Appends user content while preserving structured attachment parts.
 */
export declare function appendMessage(input: {
    readonly appended: MessageContent;
    readonly existing: MessageContent;
}): MessageContent;
/** A person's message as the model reads it. */
export declare function userContentOf(message: MessageContent): string | UserContent;
/**
 * Structural shape of the workflow `DeliverHookPayload`. Using a
 * structural type keeps this helper decoupled from the concrete
 * runtime type.
 */
interface DeliverLike {
    readonly auth?: SessionAuthContext | null;
    readonly caller?: TurnCaller;
    readonly deliveryMetadata?: readonly ChannelDeliveryMetadataEntry[];
    readonly kind: "deliver";
    readonly payloads: readonly DeliverPayload[];
}
/**
 * Coalesces an array of deliver-like items into a single item by
 * collecting all payloads and keeping the most recent auth value.
 *
 * Used by the workflow runtime to batch follow-up deliveries that
 * arrived while a turn or subagent delegation was in progress. Each
 * payload is later passed to `onDeliver` individually so channel-
 * specific fields are never lost. A caller defines a turn boundary, so
 * callers must be partitioned before coalescing.
 */
export declare function coalesceDeliveries<T extends DeliverLike>(items: readonly T[]): T;
/** Selects or transforms payloads without separating them from their receipt and caller identities. */
export declare function selectDeliveryPayloads<T extends DeliverLike>(delivery: T, selected: readonly {
    readonly index: number;
    readonly payload: DeliverPayload;
}[]): T;
export {};
