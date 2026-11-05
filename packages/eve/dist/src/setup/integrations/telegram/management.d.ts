interface TelegramManagementDeps {
    fetch: typeof fetch;
}
/** Validates a BotFather token with `getMe` and returns the bot's username. */
export declare function fetchTelegramBotUsername(botToken: string, signal?: AbortSignal, deps?: TelegramManagementDeps): Promise<string>;
export {};
