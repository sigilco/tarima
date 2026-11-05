import type { SessionAuthContext } from "#channel/types.js";
import type { TelegramMessage } from "#public/channels/telegram/inbound.js";
import type { TelegramChannelEvents, TelegramContext, TelegramInboundResult } from "#public/channels/telegram/telegramChannel.js";
/**
 * Default auth projection for Telegram webhook actors. A button press passes
 * the message it was on with the presser as `from`.
 */
export declare function defaultTelegramAuth(message: Pick<TelegramMessage, "chat" | "from" | "messageId" | "messageThreadId">): SessionAuthContext | null;
/** Default inbound message hook: dispatch allowed messages with Telegram user auth. */
export declare function defaultOnMessage(ctx: TelegramContext, message: TelegramMessage): Promise<TelegramInboundResult>;
export declare function isTelegramBotMentioned(message: Pick<TelegramMessage, "caption" | "text">, botUsername: string | undefined): boolean;
/** Built-in Telegram event handlers for typing, replies, HITL, and terminal errors. */
export declare const defaultEvents: TelegramChannelEvents;
