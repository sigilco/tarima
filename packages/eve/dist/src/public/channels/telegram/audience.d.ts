import type { TelegramInstrumentationMetadata } from "#public/channels/telegram/index.js";
import type { TelegramChannelState } from "#public/channels/telegram/telegramChannel.js";
import type { AudienceContext } from "#shared/conversation-context.js";
declare function telegramInstrumentationMetadata(state: TelegramChannelState): TelegramInstrumentationMetadata;
export declare const telegramInstrumentation: {
    readonly audience: (input: AudienceContext<TelegramChannelState>) => "private" | "public" | "unknown";
    readonly metadata: typeof telegramInstrumentationMetadata;
};
export {};
