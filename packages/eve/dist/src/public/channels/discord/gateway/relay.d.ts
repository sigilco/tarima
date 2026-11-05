/**
 * A long-running relay that holds a Discord Gateway connection and forwards
 * message dispatches to an eve agent's `discordChannel({ gateway })` route.
 * Run it in a process that stays up, such as a Vercel Daemon; it does not
 * belong in the agent itself.
 */
import { type OutboundAuthFn } from "#public/agents/auth.js";
import { type DiscordApiOptions, type DiscordBotToken } from "#public/channels/discord/api.js";
import { DiscordGatewayFatalError } from "#public/channels/discord/gateway/connection.js";
export { DiscordGatewayFatalError };
/** Options for {@link runDiscordGatewayRelay}. */
export interface DiscordGatewayRelayOptions {
    /**
     * Bot credentials. Pass the same object as the agent's `discordChannel`,
     * such as `connectDiscordCredentials(...)`. `botToken` falls back to
     * `DISCORD_BOT_TOKEN`.
     */
    readonly credentials?: {
        readonly botToken?: DiscordBotToken;
    };
    /** Discord REST API overrides. */
    readonly api?: Omit<DiscordApiOptions, "credentials">;
    /**
     * Base URL of the eve deployment. Defaults to
     * `https://$VERCEL_PROJECT_PRODUCTION_URL`, which a Vercel Daemon has. Set it
     * to `http://localhost:<port>` to relay to `eve dev`.
     */
    readonly url?: string | URL;
    /** Path of the agent's Gateway route. Defaults to `/eve/v1/discord/gateway`. */
    readonly route?: string;
    /**
     * Headers that authenticate each forwarded dispatch. Defaults to this
     * project's Vercel OIDC token, which the route accepts by default. Without a
     * token, as on a laptop, requests go out unauthenticated, which `eve dev`
     * accepts.
     */
    readonly auth?: OutboundAuthFn;
    /**
     * Also request the privileged Message Content intent, so messages that do
     * not mention the bot, such as thread follow-ups, arrive with their text.
     * Enable it under Bot in the Discord Developer Portal first, or Discord
     * refuses the connection.
     */
    readonly messageContent?: boolean;
    /** Stops the relay. Defaults to the process's `SIGTERM` and `SIGINT`. */
    readonly signal?: AbortSignal;
}
/**
 * Connects to the Discord Gateway as the bot and forwards every
 * `MESSAGE_CREATE` dispatch, unchanged and in order, to the agent's
 * `discordChannel({ gateway })` route. Reconnects and resumes on its own.
 * Resolves after `signal` aborts and in-flight deliveries drain; rejects with
 * {@link DiscordGatewayFatalError} when Discord refuses the bot's token or
 * intents.
 *
 * Run exactly one relay per bot: Discord sends every message to each
 * connection, so a second relay makes the agent answer twice.
 */
export declare function runDiscordGatewayRelay(options?: DiscordGatewayRelayOptions): Promise<void>;
