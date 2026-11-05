/**
 * Ordinary Discord messages, which Discord delivers only over its Gateway
 * WebSocket. A relay such as `runDiscordGatewayRelay` from
 * `eve/experimental/channels/discord/gateway` holds that connection and
 * forwards each dispatch, unchanged, to the route this module mounts.
 */
import type { SessionAuthContext } from "#channel/types.js";
import { type AuthFn } from "#public/channels/auth.js";
import type { DiscordChannelConfig, DiscordChannelState, DiscordContext } from "#public/channels/discord/discordChannel.js";
import { type DiscordAttachment, type DiscordUser } from "#public/channels/discord/inbound.js";
import { type HttpRouteDefinition } from "#channel/routes.js";
/** An ordinary Discord message forwarded from the Gateway. */
export interface DiscordGatewayMessage {
    readonly id: string;
    readonly channelId: string;
    /** Absent for direct messages. */
    readonly guildId?: string;
    /**
     * Message text with the bot's own mention removed. Discord sends an empty
     * string for messages that neither mention the bot nor arrive as a DM unless
     * the bot has the Message Content intent.
     */
    readonly content: string;
    readonly author: DiscordUser;
    readonly attachments: readonly DiscordAttachment[];
    /** ID of the message this one replies to, if any. */
    readonly referencedMessageId?: string;
    /**
     * Whether the message is meant for the bot: a direct message, a mention, a
     * reply to one of the bot's messages, or a message in a thread where the bot
     * already has a conversation.
     */
    readonly addressed: boolean;
    /** Discord's raw message object. */
    readonly raw: Record<string, unknown>;
}
/** Minutes of inactivity before Discord archives a thread; the values Discord accepts. */
export type DiscordThreadAutoArchiveMinutes = 60 | 1440 | 4320 | 10080;
/** Options for starting a thread from a message; see {@link DiscordMessageResult.startThread}. */
export interface DiscordStartThreadOptions {
    /** Thread name. Defaults to the message's first line, then its first attachment's filename. */
    readonly name?: string;
    /** Defaults to the channel's own setting. */
    readonly autoArchiveMinutes?: DiscordThreadAutoArchiveMinutes;
}
/**
 * Result of the Gateway message hook. Return `null` to ignore the message.
 * - `auth`: session auth context for the dispatched turn, or `null` for anonymous.
 * - `context`: model-visible context lines appended after the Discord context block.
 * - `title`: workflow run title override that does not change model input.
 * - `conversation`: which session in the channel the message joins; see
 *   {@link DiscordMessageResult.conversation}.
 * - `startThread`: answer in a new thread off the message; see
 *   {@link DiscordMessageResult.startThread}.
 */
export type DiscordMessageResult = {
    readonly auth: SessionAuthContext | null;
    readonly context?: readonly string[];
    readonly title?: string;
    /**
     * Key of the session the message joins within its Discord channel. Messages
     * with the same key share a session. A message ID is the key of the
     * session that owns that message: the one it started, or the one whose bot
     * reply it is. `"channel"` is one session for the whole channel. Any other
     * string is your own grouping, such as `` `user:${message.author.id}` ``.
     *
     * Defaults to `"channel"` in DMs and threads, which includes the thread a
     * text-channel mention starts; elsewhere, to the replied-to message's session
     * when one owns it, or else a new session keyed by this message.
     */
    readonly conversation?: string;
    /**
     * Starts a thread from the message and moves the conversation into it, as
     * one session for the thread. Applies only when the message would start a
     * new session in a text channel: DMs, messages already in a thread, and
     * replies that continue a session are left as they are. eve adds the author
     * to the thread. When Discord refuses, for example because the bot lacks the
     * Create Public Threads permission, the message is handled as if
     * `startThread` were `false`. Defaults to `gateway.startThread`.
     */
    readonly startThread?: boolean | DiscordStartThreadOptions;
} | null;
/** Sync or async {@link DiscordMessageResult}. */
export type DiscordMessageResultOrPromise = DiscordMessageResult | Promise<DiscordMessageResult>;
/** Configuration for `discordChannel({ gateway })`. */
export interface DiscordGatewayConfig {
    /** Override the route that accepts forwarded dispatches (`/eve/v1/discord/gateway`). */
    readonly route?: string;
    /**
     * Authenticates the relay. The body names the message author, so whoever
     * passes can act as any Discord user. Defaults to `localDev()` plus Vercel
     * OIDC tokens from this project's own runtime in the same environment,
     * which is what `runDiscordGatewayRelay` sends from a Vercel Daemon.
     */
    readonly auth?: AuthFn<Request> | readonly AuthFn<Request>[];
    /**
     * Decides whether a message dispatches, under what `auth`, and which
     * session it joins. Called for every conversational message from a person;
     * bot authors never reach it. Defaults to dispatching addressed messages
     * with `defaultDiscordMessageAuth` and the default `conversation`.
     */
    onMessage?(ctx: DiscordContext, message: DiscordGatewayMessage): DiscordMessageResultOrPromise;
    /**
     * Default for each accepted message's `startThread`. Defaults to `true`, so
     * the bot answers a mention in a text channel in a new thread; set `false`
     * to answer in the channel, where replies continue the conversation. An
     * `onMessage` result's own `startThread` overrides it.
     */
    readonly startThread?: boolean | DiscordStartThreadOptions;
}
/** Mounts the route that turns forwarded `MESSAGE_CREATE` dispatches into turns. */
export declare function createDiscordGatewayRoute(input: {
    readonly config: DiscordChannelConfig;
    readonly gateway: DiscordGatewayConfig;
    readonly buildContext: (state: DiscordChannelState) => DiscordContext;
}): HttpRouteDefinition<DiscordChannelState>;
