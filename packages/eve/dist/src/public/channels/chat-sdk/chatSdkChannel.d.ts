import { type PromptQueueState } from "#channel/prompt-queue.js";
import type { MessageContent } from "#shared/message-content.js";
import type { ChannelRespondOptions, ChannelSendOptions } from "#channel/channel-operations.js";
import type { SessionAuthContext, TurnPolicy } from "#channel/types.js";
import type { RequestSettlement } from "#channel/interaction-prompts.js";
import type { Interaction } from "#channel/interaction-prompts.js";
import { type Answer, type StrictAnswers } from "#shared/input.js";
import type { ActionEvent, Adapter, ChatConfig, SerializedThread, Thread, WebhookOptions } from "#compiled/chat/index.js";
import { Chat } from "#compiled/chat/index.js";
import { type UndeliveredReplyState } from "#public/channels/undelivered-reply.js";
import { type Channel, type ChannelEvents, type ChannelContinuationOps, type Delivery } from "#public/definitions/channel.js";
type ChatSdkAdapters = Record<string, Adapter>;
/** Durable Chat SDK thread state. */
export interface ChatSdkChannelState extends Record<string, unknown>, PromptQueueState, UndeliveredReplyState {
    thread: SerializedThread | null;
    /**
     * The Chat SDK user behind each principal that sent a message, so a sign-in
     * reaches them privately. `null` once more than one person sent as it.
     */
    usersByPrincipal?: Record<string, string | null>;
    /** Id of the latest message someone other than the bot sent in the thread. */
    latestMessageId?: string;
}
/** One posted card's requests and the resolutions eve has reported for them so far. */
export interface ChatSdkPendingInputCard {
    readonly requests: readonly Interaction[];
    readonly resolved: Readonly<Record<string, RequestSettlement>>;
}
/**
 * Thread selector accepted by `chatSdkChannel().receive`. Pass a serialized
 * Chat SDK thread when possible; `threadId` plus `adapterName` is supported for
 * proactive sends that only have a provider-native thread id.
 */
export interface ChatSdkReceiveTarget {
    readonly adapterName?: string;
    readonly thread?: SerializedThread;
    readonly threadId?: string;
}
/**
 * Channel-owned metadata exposed to eve instrumentation.
 */
export interface ChatSdkInstrumentationMetadata extends Record<string, unknown> {
    readonly adapterName: string | null;
    readonly channelId: string | null;
    readonly isDM: boolean | null;
    readonly threadId: string | null;
}
/**
 * Per-session context passed to `chatSdkChannel({ events })` handlers. `thread`
 * is rebuilt from persisted channel state using the configured Chat SDK
 * adapter, so default handlers can post back to the originating chat thread.
 */
export interface ChatSdkChannelContext<TAdapters extends ChatSdkAdapters = ChatSdkAdapters> {
    readonly bot: Chat<TAdapters>;
    readonly thread: Thread | null;
    state: ChatSdkChannelState;
    /** Whether streamed deltas are delivered via a post+edit fallback. */
    readonly streaming: boolean;
    /** Minimum interval between streaming edits, in ms. */
    readonly streamingEditIntervalMs: number;
}
/** Event-handler context for `chatSdkChannel`, including continuation routing. */
export interface ChatSdkEventContext<TAdapters extends ChatSdkAdapters = ChatSdkAdapters> extends ChatSdkChannelContext<TAdapters>, ChannelContinuationOps {
}
/**
 * Per-event handlers for `chatSdkChannel({ events })`. Each supplied handler
 * replaces the built-in default for that event.
 */
export type ChatSdkChannelEvents<TAdapters extends ChatSdkAdapters = ChatSdkAdapters> = ChannelEvents<ChatSdkChannelContext<TAdapters>>;
/** Selects the Chat SDK thread that owns the eve continuation token. */
interface ChatSdkThreadOptions {
    readonly auth?: SessionAuthContext | null;
    readonly thread: SerializedThread | Thread | string;
    /**
     * Required when `thread` is a string that does not include the Chat SDK
     * adapter prefix. Prefer passing the `Thread` object from the Chat SDK handler
     * when possible.
     */
    readonly adapterName?: string;
}
/**
 * Options for `bridge.send`: channel send options plus the thread. The thread
 * determines the eve continuation token and persisted channel state.
 */
export interface ChatSdkSendOptions extends ChatSdkThreadOptions, Omit<ChannelSendOptions, "auth"> {
    /**
     * Answers the input request on the card eve posted as `messageId` with
     * `optionId`, when that card is still waiting on it. Otherwise eve delivers
     * the message as usual.
     */
    readonly inputAnswer?: ChatSdkInputAnswer;
    /**
     * Controls how this input interacts with an active eve turn on the same
     * thread. Defaults to the channel's `turnPolicy`, then `"steer"`.
     */
    readonly turnPolicy?: TurnPolicy;
}
/** An option chosen for the input request card posted as `messageId`. */
export interface ChatSdkInputAnswer {
    readonly messageId: string;
    readonly optionId: string;
}
/** Options for `bridge.respond`: channel respond options plus the thread. */
export interface ChatSdkRespondOptions extends ChatSdkThreadOptions, Omit<ChannelRespondOptions, "auth" | "state"> {
}
/**
 * Configuration for {@link chatSdkChannel}. It accepts normal Chat SDK
 * `ChatConfig` fields, plus eve route and event settings.
 */
export interface ChatSdkChannelConfig<TAdapters extends ChatSdkAdapters = ChatSdkAdapters> extends Omit<ChatConfig<TAdapters>, "adapters"> {
    /** Map of Chat SDK adapter name to adapter instance. */
    readonly adapters: TAdapters;
    /**
     * Base route for generated adapter webhooks. Defaults to `/eve/v1`, so an
     * adapter named `slack` mounts at `/eve/v1/slack`.
     */
    readonly route?: string;
    /**
     * Per-adapter route overrides. Use when a provider requires a fixed webhook
     * URL or when migrating an existing endpoint without changing provider
     * settings.
     */
    readonly routes?: Partial<Record<Extract<keyof TAdapters, string>, string>>;
    /** Policy for accepted messages that arrive while a turn is active. */
    readonly turnPolicy?: TurnPolicy;
    /** Extra Chat SDK webhook options. eve owns `waitUntil`. */
    readonly webhook?: Omit<WebhookOptions, "waitUntil">;
    /** Optional eve event handlers. Supplied handlers replace built-in defaults. */
    readonly events?: ChatSdkChannelEvents<TAdapters>;
    /**
     * Prefix for default eve HITL button action ids. Change this if your Chat SDK
     * app already uses the `eve_input:` prefix.
     */
    readonly inputActionPrefix?: string;
    /**
     * Auth resolver for default HITL button clicks. Defaults to `null`; provide a
     * resolver when continued sessions should keep user or tenant auth.
     */
    readonly resolveInputAuth?: (event: ActionEvent) => SessionAuthContext | null | Promise<SessionAuthContext | null>;
    /**
     * Whether the default handlers stream assistant output by posting an initial
     * message and editing it as deltas arrive. Defaults to `true`. Set to `false`
     * for adapters that only deliver a single message per turn (e.g. email), so
     * replies post once on completion.
     */
    readonly streaming?: boolean;
    /**
     * Minimum interval between streaming edits, in ms. Defaults to `1000`. Only
     * used when `streaming` is enabled and the adapter supports editing.
     */
    readonly streamingEditIntervalMs?: number;
}
/** Concrete channel value returned on `bridge.channel`. */
export interface ChatSdkChannel extends Channel<ChatSdkChannelState, ChatSdkReceiveTarget, ChatSdkInstrumentationMetadata> {
}
/**
 * Return value of {@link chatSdkChannel}. Export `channel` from
 * `agent/channels/<name>.ts`, then register handlers on `bot` and call `send`
 * from those handlers to hand work to eve.
 */
export interface ChatSdkChannelBridge<TAdapters extends ChatSdkAdapters = ChatSdkAdapters> {
    readonly bot: Chat<TAdapters>;
    readonly channel: ChatSdkChannel;
    /**
     * Starts or resumes an eve session from inside a Chat SDK webhook handler.
     * Use `channel.receive(...)` for proactive sends that are not handling an
     * inbound Chat SDK webhook.
     */
    send(message: MessageContent, options: ChatSdkSendOptions): Promise<Delivery>;
    /**
     * Answers pending input requests on the thread's session from inside a Chat
     * SDK webhook handler. Never creates a session.
     */
    respond<const TResponses extends readonly Answer[]>(answers: StrictAnswers<TResponses>, options: ChatSdkRespondOptions): Promise<Delivery>;
}
/**
 * Creates an eve channel backed by one Chat SDK runtime and its adapters.
 *
 * @example
 * ```ts
 * import { createSlackAdapter } from "@chat-adapter/slack";
 * import { createMemoryState } from "@chat-adapter/state-memory";
 * import { chatSdkChannel } from "eve/channels/chat-sdk";
 *
 * export const { bot, channel, send } = chatSdkChannel({
 *   userName: "acme",
 *   adapters: { slack: createSlackAdapter() },
 *   state: createMemoryState(),
 * });
 *
 * bot.onNewMention(async (thread, message) => {
 *   await send(message.text, { thread });
 * });
 * ```
 */
export declare function chatSdkChannel<TAdapters extends ChatSdkAdapters>(config: ChatSdkChannelConfig<TAdapters>): ChatSdkChannelBridge<TAdapters>;
export {};
