import type { SessionAuthContext } from "#channel/types.js";
import type { Adapter, Author, Chat, Message, ReactionEvent, Thread } from "#compiled/chat/index.js";
import type { ChatSdkChannel, ChatSdkChannelBridge } from "#public/channels/chat-sdk/index.js";
import { type ToolDefinition } from "#public/tools/index.js";
/** The six standard iMessage tapbacks. */
export declare const IMESSAGE_TAPBACKS: readonly ["love", "like", "dislike", "laugh", "emphasize", "question"];
/** A standard iMessage tapback. */
export type IMessageTapbackType = (typeof IMESSAGE_TAPBACKS)[number];
/** A tapback someone added to or removed from a message in an iMessage conversation. */
export interface IMessageTapback {
    /** `true` when the tapback was added, `false` when it was removed. */
    readonly added: boolean;
    /** The person who sent the tapback. */
    readonly author: Author;
    /** The message the tapback is on, when the provider includes it. */
    readonly message?: Message;
    /** Id of the message the tapback is on. */
    readonly messageId: string;
    /** The provider's raw event. */
    readonly raw: unknown;
    /** A standard tapback, or the emoji itself for an emoji tapback. */
    readonly tapback: IMessageTapbackType | (string & {});
}
/** Result of an `onTapback` hook. Return `null` to ignore the tapback. */
export type IMessageTapbackResult = {
    /**
     * Option id that answers the input request eve posted in the message the
     * tapback is on, such as `"approve"` or `"deny"` for a tool approval.
     * When that message isn't waiting on an answer with this option, the agent
     * receives the tapback as a message instead.
     */
    readonly answer?: string;
    readonly auth: SessionAuthContext | null;
    readonly context?: readonly string[];
    /**
     * Replaces the text the agent receives. Defaults to text like
     * `Tapback: Loved “See you at 7”`.
     */
    readonly message?: string;
    /** Overrides the workflow run title without changing the message sent to the model. */
    readonly title?: string;
} | null;
/** Input of the tool returned by `tapbackTool()`. */
export interface IMessageTapbackToolInput {
    /** A standard tapback, or a single emoji such as `"🎉"`. */
    readonly tapback: IMessageTapbackType | (string & {});
}
/** Context passed to an `onTapback` hook. */
export interface IMessageTapbackContext {
    /** Low-level Chat SDK thread for iMessage-specific operations. */
    readonly thread: Thread<unknown>;
}
type TapbackHook = (ctx: IMessageTapbackContext, tapback: IMessageTapback) => IMessageTapbackResult | Promise<IMessageTapbackResult>;
/** Sends an emoji tapback (not one of the six standard ones) through the channel's adapter. */
export type SendEmojiTapback = (adapter: Adapter, threadId: string, messageId: string, emoji: string) => Promise<void>;
/** Normalizes a Chat SDK reaction event from an iMessage adapter. */
export declare function toIMessageTapback(event: ReactionEvent): IMessageTapback;
/** Model-visible text for a tapback, in the form iMessage uses for tapbacks shown as text. */
export declare function iMessageTapbackText(tapback: IMessageTapback): string;
/** Sends tapbacks people add or remove to eve when `onTapback` accepts them. */
export declare function dispatchIMessageTapbacks<TAdapters extends Record<string, Adapter>>(bridge: ChatSdkChannelBridge<TAdapters>, onTapback: TapbackHook): void;
/**
 * Builds a tool that reacts to the latest message in the session's iMessage
 * conversation. It acts only in sessions that came through `channel`.
 */
export declare function iMessageTapbackTool(options: {
    readonly adapterName: string;
    readonly bot: Chat;
    readonly channel: ChatSdkChannel;
    readonly channelLabel: string;
    /** Defaults to the adapter's `addReaction`. */
    readonly sendEmoji?: SendEmojiTapback;
}): ToolDefinition<IMessageTapbackToolInput, string>;
export {};
