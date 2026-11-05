/** Non-secret Discord application metadata resolved from a bot token. */
interface DiscordApplication {
    id: string;
    name: string;
    publicKey: string;
}
/** Validates a bot token and returns its Discord application. */
export declare function resolveDiscordApplication(botToken: string, fetchImpl?: typeof fetch): Promise<DiscordApplication>;
/** Registers the global command consumed by the default Discord channel. */
export declare function registerDiscordCommand(applicationId: string, botToken: string, command: {
    name: string;
    description: string;
}, fetchImpl?: typeof fetch): Promise<void>;
/** Points Discord HTTP Interactions at a persisted Connect connector. */
export declare function configureDiscordInteractionsEndpoint(botToken: string, connectorId: string, fetchImpl?: typeof fetch): Promise<void>;
/**
 * Turns on the Message Content intent, so messages that don't mention the bot,
 * such as thread follow-ups, arrive with their text. Returns `false` when
 * Discord refuses, as it does for a verified app in 100 or more servers, which
 * needs Discord's approval instead.
 */
export declare function enableDiscordMessageContentIntent(botToken: string, fetchImpl?: typeof fetch): Promise<boolean>;
export {};
