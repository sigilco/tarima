/**
 * Inbound Discord interaction parsing and prompt shaping.
 *
 * The channel owns small, documented data shapes instead of exposing
 * Discord's raw interaction payloads as the primary public API.
 */
/** Maps the Discord interaction kinds the channel handles to their wire `type` integers. */
export declare const DISCORD_INTERACTION_TYPE: {
    readonly APPLICATION_COMMAND: 2;
    readonly MESSAGE_COMPONENT: 3;
    readonly MODAL_SUBMIT: 5;
    readonly PING: 1;
};
/** Maps Discord interaction callback kinds to the wire `type` integers used in interaction responses. */
export declare const DISCORD_INTERACTION_RESPONSE_TYPE: {
    readonly CHANNEL_MESSAGE_WITH_SOURCE: 4;
    readonly DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5;
    readonly DEFERRED_UPDATE_MESSAGE: 6;
    readonly MODAL: 9;
    readonly PONG: 1;
};
/** Discord message `flags` bit (1 << 6 = 64) marking a response ephemeral (visible only to the invoking user). */
export declare const DISCORD_EPHEMERAL_MESSAGE_FLAG: number;
/** Discord user metadata surfaced by inbound interactions. */
export interface DiscordUser {
    readonly avatar?: string;
    readonly discriminator?: string;
    readonly globalName?: string;
    readonly id: string;
    readonly isBot: boolean;
    readonly username: string;
}
/** Discord guild member metadata surfaced by inbound interactions. */
export interface DiscordMember {
    readonly nick?: string;
    readonly roles: readonly string[];
    readonly user: DiscordUser;
}
/** Common fields shared by parsed Discord interactions. */
export interface DiscordInteractionBase {
    readonly applicationId: string;
    readonly channelId: string;
    readonly channelType?: number;
    readonly guildId?: string;
    readonly id: string;
    readonly member?: DiscordMember;
    readonly token: string;
    readonly user: DiscordUser;
    readonly raw: Record<string, unknown>;
}
/**
 * One slash-command option from Discord's interaction payload. `value` holds the
 * primitive argument for leaf options and is undefined for subcommands and
 * subcommand groups, which carry their child options in `options`.
 */
export interface DiscordCommandOption {
    readonly name: string;
    /** Discord's option type integer, e.g. 3 for a string or 11 for an attachment. */
    readonly type?: number;
    readonly value?: string | number | boolean;
    readonly options: readonly DiscordCommandOption[];
}
/** A file a person attached to a slash command through an attachment option. */
export interface DiscordAttachment {
    readonly id: string;
    /** Signed Discord CDN URL the file downloads from. */
    readonly url: string;
    readonly filename: string;
    readonly contentType?: string;
    readonly size?: number;
}
/** Parsed Discord slash/application command interaction. */
export interface DiscordCommandInteraction extends DiscordInteractionBase {
    /** Files attached through the command's attachment options, in option order. */
    readonly attachments: readonly DiscordAttachment[];
    readonly commandId?: string;
    readonly commandName: string;
    readonly options: readonly DiscordCommandOption[];
    readonly type: typeof DISCORD_INTERACTION_TYPE.APPLICATION_COMMAND;
}
/**
 * Parsed Discord message-component interaction. `componentType` is Discord's
 * raw component-type integer (0 when absent). `values` holds the selected option
 * ids for string-select components and is empty for buttons.
 */
export interface DiscordComponentInteraction extends DiscordInteractionBase {
    readonly componentType: number;
    readonly customId: string;
    readonly messageId: string;
    readonly type: typeof DISCORD_INTERACTION_TYPE.MESSAGE_COMPONENT;
    readonly values: readonly string[];
}
/** Parsed Discord modal-submit interaction. */
export interface DiscordModalSubmitInteraction extends DiscordInteractionBase {
    readonly customId: string;
    readonly messageId?: string;
    readonly textInputs: Readonly<Record<string, string>>;
    readonly type: typeof DISCORD_INTERACTION_TYPE.MODAL_SUBMIT;
}
/** Parsed Discord interaction variants handled by the native channel. */
export type DiscordInteraction = DiscordCommandInteraction | DiscordComponentInteraction | DiscordModalSubmitInteraction;
/**
 * Fields rendered into the model-visible `<discord_context>` block by
 * {@link formatDiscordContextBlock}. Optional fields are omitted from the
 * block when not provided.
 */
export interface DiscordInboundContext {
    readonly applicationId?: string;
    readonly channelId: string;
    readonly commandName?: string;
    readonly guildId?: string;
    /** Set for interactions such as slash commands. */
    readonly interactionId?: string;
    /** Set for ordinary messages forwarded from the Discord Gateway. */
    readonly messageId?: string;
    readonly userId: string;
    readonly username?: string;
}
/** Parses one JSON-decoded Discord interaction payload. */
export declare function parseDiscordInteraction(value: unknown): DiscordInteraction | null;
/** Returns the model-facing prompt for a command: the value of a `message` option when present and non-blank, otherwise a reconstructed `/command opt:value ...` string. */
export declare function commandInteractionMessage(interaction: DiscordCommandInteraction): string;
/** Renders one {@link DiscordInboundContext} as a deterministic context block. */
export declare function formatDiscordContextBlock(context: DiscordInboundContext): string;
/** Parses a raw Discord user object, as interactions and Gateway messages carry it. */
export declare function parseDiscordUser(value: unknown): DiscordUser | null;
/** Parses a raw Discord attachment object, as Gateway messages and resolved command data carry it. */
export declare function parseDiscordAttachment(raw: unknown): DiscordAttachment | null;
