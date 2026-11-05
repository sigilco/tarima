import type { TelegramCallbackQuery, TelegramMessage } from "#public/channels/telegram/inbound.js";
import type { TelegramChannelState } from "#public/channels/telegram/telegramChannel.js";
export declare function stateFromTelegramMessage(message: TelegramMessage, botUsername: string | undefined): TelegramChannelState;
export declare function stateFromTelegramCallbackQuery(query: TelegramCallbackQuery, botUsername: string | undefined): TelegramChannelState;
export declare function telegramContinuationTokenFromState(state: TelegramChannelState): string;
export declare function initialTelegramState(botUsername: string | undefined): TelegramChannelState;
