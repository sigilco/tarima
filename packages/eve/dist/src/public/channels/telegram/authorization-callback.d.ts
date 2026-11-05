import type { ChannelResolveSession } from "#channel/channel-operations.js";
import type { TelegramCallbackQuery } from "#public/channels/telegram/inbound.js";
import type { TelegramChannelState, TelegramContext } from "#public/channels/telegram/telegramChannel.js";
export declare function dispatchTelegramAuthorizationCallback(input: {
    readonly continuationToken: string;
    readonly query: TelegramCallbackQuery;
    readonly resolveSession: ChannelResolveSession;
    readonly state: TelegramChannelState;
    readonly telegram: TelegramContext;
}): Promise<void>;
