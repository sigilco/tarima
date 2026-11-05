import type { TelegramChannelCredentials } from "#public/channels/telegram/credentials.js";
export type { TelegramChannelCredentials } from "#public/channels/telegram/credentials.js";
import type { ChannelEventContext, ChannelEventOf } from "#public/definitions/channel.js";
import type { SessionEvent } from "#protocol/session-event.js";
import type { TelegramInstrumentationMetadata } from "#public/channels/telegram/index.js";
import type { SessionHistoryMessage } from "#shared/session-history.js";
import type { SessionAuthContext, TurnPolicy } from "#channel/types.js";
import type { ChannelContinuationOps } from "#public/definitions/channel.js";
import { type TelegramApiOptions, type TelegramApiResponse, type TelegramMessageBody, type TelegramMessageResult } from "#public/channels/telegram/api.js";
import { type TelegramHitlState } from "#public/channels/telegram/hitl.js";
import { type TelegramCallbackQuery, type TelegramChatType, type TelegramMessage } from "#public/channels/telegram/inbound.js";
import { type UploadPolicyInput } from "#public/channels/upload-policy.js";
import { type Channel } from "#public/definitions/channel.js";
import { type JsonObject } from "#shared/json.js";
/** Minimal Telegram context (only `telegram`, no `state` or session ops), passed to `onMessage` and `onCallbackQuery` hooks before a session exists. Event handlers receive the richer {@link TelegramEventContext}. */
export interface TelegramContext {
    readonly telegram: TelegramHandle;
}
/** Channel-owned Telegram context returned by `context()`. */
export interface TelegramChannelContext extends TelegramContext {
    state: TelegramChannelState;
}
/** Event-handler Telegram context, including continuation routing. */
export interface TelegramEventContext extends TelegramChannelContext, ChannelContinuationOps {
}
/** JSON-serializable Telegram channel state. */
export interface TelegramChannelState extends TelegramHitlState {
    /** Telegram bot username used for group mention detection, when configured. */
    botUsername?: string | null;
    /** Telegram chat id. */
    chatId: string | null;
    /** Telegram chat type, when known from an inbound update. */
    chatType: TelegramChatType | null;
    /** Group/supergroup conversation anchor message id. */
    conversationId: string | null;
    /** Forum topic id, when known. */
    messageThreadId: number | null;
    /** Telegram user id that triggered the current session/turn. */
    triggeringUserId?: string | null;
    /**
     * Bot message id that the triggering message replied to. The deliver hook
     * reads it from delivery state to answer a pending ForceReply prompt.
     */
    replyToBotMessageId?: string | null;
}
/** Telegram channel credentials. `webhookVerifier` is a custom inbound webhook verifier for forwarded webhooks. */
/** Target for `receive(telegram, { target })` proactive sessions. `chatId` is required. `conversationId` resumes an existing thread; `initialMessage` posts a seed message and starts a new thread from it. The two are mutually exclusive: supplying both throws. */
export interface TelegramReceiveTarget {
    readonly chatId: number | string;
    readonly conversationId?: number | string;
    readonly initialMessage?: string | TelegramMessageBody;
    readonly messageThreadId?: number;
}
/** Result of an inbound Telegram message hook. Return `null` to drop the update. */
export type TelegramInboundResult = {
    readonly auth: SessionAuthContext | null;
    readonly context?: readonly string[];
    /** Prior conversation added as user and assistant turns before this message. */
    readonly history?: readonly SessionHistoryMessage[];
    /** Overrides the workflow run title without changing the message sent to the model. */
    readonly title?: string;
} | null;
/** Sync or async {@link TelegramInboundResult}. */
type TelegramEventHandler<T extends SessionEvent["type"]> = (event: ChannelEventOf<T>, ctx: ChannelEventContext<TelegramEventContext>) => void | Promise<void>;
/**
 * Per-event handlers for `telegramChannel({ events })`. Each entry overrides the built-in default
 * (handlers merge over {@link defaultEvents}). Every handler receives the event and a `ctx` whose
 * `channel` is the Telegram context.
 */
export interface TelegramChannelEvents {
    readonly "turn.started"?: TelegramEventHandler<"turn.started">;
    readonly "call.requested"?: TelegramEventHandler<"call.requested">;
    readonly "call.progress"?: TelegramEventHandler<"call.progress">;
    readonly "call.settled"?: TelegramEventHandler<"call.settled">;
    readonly "content.completed"?: TelegramEventHandler<"content.completed">;
    readonly "content.delta"?: TelegramEventHandler<"content.delta">;
    readonly "interaction.opened"?: TelegramEventHandler<"interaction.opened">;
    readonly "interaction.settled"?: TelegramEventHandler<"interaction.settled">;
    readonly "turn.settled"?: TelegramEventHandler<"turn.settled">;
    readonly "session.ended"?: TelegramEventHandler<"session.ended">;
    readonly "delivery.settled"?: TelegramEventHandler<"delivery.settled">;
}
/** Configuration for {@link telegramChannel}. */
export interface TelegramChannelConfig {
    /** API transport overrides (base URLs, custom fetch). Credentials are supplied separately via `credentials`. */
    readonly api?: Omit<TelegramApiOptions, "credentials">;
    /** Bot username (without `@`) used to detect mentions and `/command@bot` in group chats. */
    readonly botUsername?: string;
    /** Bot token and inbound webhook verification settings. */
    readonly credentials?: TelegramChannelCredentials;
    /** Per-event handler overrides. See {@link TelegramChannelEvents}. */
    readonly events?: TelegramChannelEvents;
    /** Handler for non-HITL callback queries. */
    readonly onCallbackQuery?: (ctx: TelegramContext, query: TelegramCallbackQuery) => void | Promise<void>;
    /** Inbound message hook. Defaults to Telegram user auth and dispatch gating. */
    readonly onMessage?: (ctx: TelegramContext, message: TelegramMessage) => TelegramInboundResult | Promise<TelegramInboundResult>;
    /** Override the default webhook route path (`/eve/v1/telegram`). */
    readonly route?: string;
    /** Policy for accepted messages that arrive while a turn is active. */
    readonly turnPolicy?: TurnPolicy;
    /** Inbound upload policy for Telegram photos and documents. */
    readonly uploadPolicy?: UploadPolicyInput;
}
/** Low-level Telegram handle on every channel context as `ctx.telegram`. `request` issues a raw Bot API call by method name and returns the decoded response. `post` and `sendMessage` are identical: each sends a message, splitting text over the 4096-character cap into multiple messages and resolving to the first. `startTyping` sends a chat action (defaults to `typing`) and never throws: it logs and swallows failures. */
export interface TelegramHandle {
    readonly botUsername: string | undefined;
    readonly chatId: string;
    readonly chatType: TelegramChatType | undefined;
    readonly conversationId: string | undefined;
    readonly messageThreadId: number | undefined;
    request(method: string, body?: JsonObject): Promise<TelegramApiResponse>;
    post(message: string | TelegramMessageBody): Promise<TelegramMessageResult>;
    /** Posts a group or supergroup message visible only to `userId`. */
    postEphemeral(userId: number | string, message: string | TelegramMessageBody, options?: {
        readonly callbackQueryId?: string;
    }): Promise<TelegramMessageResult>;
    sendMessage(message: string | TelegramMessageBody): Promise<TelegramMessageResult>;
    startTyping(action?: string): Promise<void>;
    answerCallbackQuery(input: {
        readonly callbackQueryId: string;
        readonly showAlert?: boolean;
        readonly text?: string;
    }): Promise<TelegramApiResponse>;
    editMessageReplyMarkup(input: {
        readonly messageId: number | string;
        readonly replyMarkup?: Readonly<Record<string, unknown>>;
    }): Promise<TelegramApiResponse>;
    editMessageText(input: {
        readonly messageId: number | string;
        readonly replyMarkup?: Readonly<Record<string, unknown>>;
        readonly text: string;
    }): Promise<TelegramApiResponse>;
}
/** Concrete return type of {@link telegramChannel}. */
export interface TelegramChannel extends Channel<TelegramChannelState, TelegramReceiveTarget, TelegramInstrumentationMetadata> {
}
/** Telegram channel factory for webhook updates and proactive messages. */
export declare function telegramChannel(config?: TelegramChannelConfig): TelegramChannel;
