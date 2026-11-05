import type { SessionAuthContext } from "#channel/types.js";
import type { DiscordCommandInteraction, DiscordInteractionBase } from "#public/channels/discord/inbound.js";
import type { DiscordGatewayMessage, DiscordMessageResult } from "#public/channels/discord/messages.js";
import type { DiscordChannelEvents, DiscordChannelState, DiscordCommandResult, DiscordContext, DiscordHandle, DiscordHitlPrompt } from "#public/channels/discord/discordChannel.js";
/**
 * Builds the default {@link SessionAuthContext} for the user behind a Discord
 * interaction (a command, button press, select, or modal submission):
 * authenticator `discord-interaction`, guild-scoped issuer/principalId when
 * invoked in a guild (else user-scoped), and `principalType` `service` for bot actors or
 * `user` otherwise. Copies the channel, interaction, user, guild, and
 * member-nick attributes. A message from the same person gets the same
 * principal from {@link defaultDiscordMessageAuth}.
 */
export declare function defaultDiscordAuth(interaction: DiscordInteractionBase): SessionAuthContext;
/**
 * Builds the default {@link SessionAuthContext} for the author of a Discord
 * message forwarded from the Gateway. The principal matches what
 * {@link defaultDiscordAuth} builds for the same person, so their button
 * presses answer approvals their messages asked for.
 */
export declare function defaultDiscordMessageAuth(message: DiscordGatewayMessage): SessionAuthContext;
/** Default command hook: dispatch with Discord user auth. */
export declare function defaultOnCommand(_ctx: DiscordContext, interaction: DiscordCommandInteraction): DiscordCommandResult;
/**
 * Edits a posted prompt the way a resolved one reads: its prompt kept, its
 * choices replaced by `label`. Throws when Discord refuses the edit.
 */
export declare function editDiscordResolvedPrompt(discord: Pick<DiscordHandle, "channelId" | "request">, prompt: Pick<DiscordHitlPrompt, "content" | "messageId">, label: string): Promise<void>;
/** Default Gateway message hook: dispatch messages addressed to the bot with Discord user auth. */
export declare function defaultOnMessage(_ctx: DiscordContext, message: DiscordGatewayMessage): DiscordMessageResult;
/**
 * Whether only the person signing in reads the conversation: a one-to-one DM (channel type 1),
 * from an interaction or a Gateway message. A group DM has no guild either, but every member
 * reads it. A session eve started itself records no channel type, so it isn't taken as private.
 */
export declare function signsInPrivately(state: DiscordChannelState): boolean;
/** Built-in Discord event handlers for typing, replies, HITL, and terminal errors. */
export declare const defaultEvents: DiscordChannelEvents;
