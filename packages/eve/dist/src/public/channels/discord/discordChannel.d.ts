import type { DiscordChannelCredentials } from "#public/channels/discord/credentials.js";
export type { DiscordChannelCredentials } from "#public/channels/discord/credentials.js";
import type { ChannelEventContext, ChannelEventOf } from "#public/definitions/channel.js";
import type { SessionEvent } from "#protocol/session-event.js";
import type { DiscordInstrumentationMetadata } from "#public/channels/discord/index.js";
import type { SessionHistoryMessage } from "#shared/session-history.js";
import type { SessionAuthContext, TurnPolicy } from "#channel/types.js";
import type { ChannelContinuationOps } from "#public/definitions/channel.js";
import { type DiscordApiOptions, type DiscordApiResponse, type DiscordMessageBody, type DiscordPostedMessage } from "#public/channels/discord/api.js";
import { type DiscordCommandInteraction, type DiscordComponentInteraction, type DiscordModalSubmitInteraction } from "#public/channels/discord/inbound.js";
import { type DiscordGatewayConfig } from "#public/channels/discord/messages.js";
import { type JsonObject } from "#shared/json.js";
import { type Channel } from "#public/definitions/channel.js";
import type { InteractionOption } from "#protocol/session-events/families/interaction.js";
import type { ChannelAudience } from "#shared/channel-audience.js";
/** Pre-dispatch Discord context passed to inbound command hooks. */
export interface DiscordContext {
    readonly discord: DiscordHandle;
}
/** Context passed to `discordChannel({ onAnswers })` before eve answers the pending request. */
export interface DiscordAnswerContext extends DiscordContext {
    /** Auth derived from the Discord user who pressed or submitted, as `defaultDiscordAuth` builds it. */
    readonly defaultAuth: SessionAuthContext;
}
/** Channel-owned Discord context returned by `context()`. */
export type DiscordChannelContext = DiscordContext & {
    state: DiscordChannelState;
};
/** Event-handler Discord context, including continuation routing. */
export interface DiscordEventContext extends DiscordChannelContext, ChannelContinuationOps {
}
/** JSON-serializable Discord channel state. */
export interface DiscordChannelState {
    audience?: ChannelAudience;
    /** Discord channel id. */
    channelId: string | null;
    /** Discord message id once anchored, or an interaction placeholder before the first reply. */
    conversationId: string | null;
    /** Discord guild id, when the interaction was invoked in a guild. */
    guildId: string | null;
    /** The Discord channel type the interaction came from, such as 1 for a DM. */
    channelType?: number;
    /** Discord application id from the inbound interaction. */
    applicationId: string | null;
}
/** What a posted prompt needs so its message can be edited once eve resolves it. */
export interface DiscordHitlPrompt {
    readonly content: string;
    readonly messageId: string;
    readonly options: readonly Pick<InteractionOption, "id" | "label">[];
}
/** Discord channel credentials. */
/** Target accepted by `receive(discord, { target })` for proactive sessions. */
export interface DiscordReceiveTarget {
    readonly channelId: string;
    readonly conversationId?: string;
    readonly initialMessage?: string | DiscordMessageBody;
}
/**
 * Result of an inbound Discord command hook. Return `null` to acknowledge the
 * interaction without dispatching the agent.
 * - `auth`: session auth context for the dispatched turn, or `null` for anonymous.
 * - `ephemeral`: when `true`, the deferred reply is visible only to the invoking user.
 * - `context`: model-visible context lines appended after the Discord context block.
 * - `title`: workflow run title override that does not change model input.
 */
export type DiscordCommandResult = {
    readonly auth: SessionAuthContext | null;
    readonly ephemeral?: boolean;
    readonly context?: readonly string[];
    /** Prior conversation added as user and assistant turns before this message. */
    readonly history?: readonly SessionHistoryMessage[];
    readonly title?: string;
} | null;
/** Sync or async {@link DiscordCommandResult}. */
/** Result of {@link DiscordChannelConfig.onAnswers}: `{ auth }` to accept the answer, or `null` to drop it. */
export type DiscordAnswerResult = {
    readonly auth: SessionAuthContext | null;
} | null;
/** A Discord interaction that answers a pending request: a button press, a select, or a modal submission. */
export type DiscordAnswerInteraction = DiscordComponentInteraction | DiscordModalSubmitInteraction;
type DiscordEventHandler<T extends SessionEvent["type"]> = (event: ChannelEventOf<T>, ctx: ChannelEventContext<DiscordEventContext>) => void | Promise<void>;
/**
 * Per-event handlers for `discordChannel({ events })`. Supplied handlers override built-in
 * defaults per key; unspecified events keep their defaults. Each handler receives the event and
 * a `ctx` whose `channel` is the Discord context.
 */
export interface DiscordChannelEvents {
    readonly "turn.started"?: DiscordEventHandler<"turn.started">;
    readonly "call.requested"?: DiscordEventHandler<"call.requested">;
    readonly "call.progress"?: DiscordEventHandler<"call.progress">;
    readonly "call.settled"?: DiscordEventHandler<"call.settled">;
    readonly "content.completed"?: DiscordEventHandler<"content.completed">;
    readonly "content.delta"?: DiscordEventHandler<"content.delta">;
    readonly "interaction.opened"?: DiscordEventHandler<"interaction.opened">;
    readonly "interaction.settled"?: DiscordEventHandler<"interaction.settled">;
    readonly "turn.settled"?: DiscordEventHandler<"turn.settled">;
    readonly "session.ended"?: DiscordEventHandler<"session.ended">;
    readonly "delivery.settled"?: DiscordEventHandler<"delivery.settled">;
}
/** Configuration for {@link discordChannel}. */
export interface DiscordChannelConfig {
    readonly api?: Omit<DiscordApiOptions, "credentials">;
    readonly credentials?: DiscordChannelCredentials;
    /** Override the default interaction route path (`/eve/v1/discord`). */
    readonly route?: string;
    /** Policy for accepted messages that arrive while a turn is active. */
    readonly turnPolicy?: TurnPolicy;
    /** Inbound command hook. Defaults to user-scoped Discord auth and dispatch. Return `{ auth }` to dispatch, or `null` to acknowledge without running the agent. */
    onCommand?(ctx: DiscordContext, interaction: DiscordCommandInteraction): DiscordCommandResult | Promise<DiscordCommandResult>;
    /**
     * Authorizes a button press, select, or modal submission before it answers a
     * pending request. Return `{ auth }` to accept the answer, or `null` to drop
     * it and keep the request pending. Thrown errors are logged and drop the
     * answer. Defaults to the interacting user's Discord auth. With a custom
     * `onCommand` and no `onAnswers`, every answer is dropped: set it to
     * give a person's answers the same principal, and gating, as their commands.
     */
    onAnswers?(ctx: DiscordAnswerContext, interaction: DiscordAnswerInteraction): DiscordAnswerResult | Promise<DiscordAnswerResult>;
    /**
     * Accepts ordinary messages (DMs, mentions, and thread follow-ups) that a
     * relay forwards from the Discord Gateway, such as `runDiscordGatewayRelay`
     * from `eve/experimental/channels/discord/gateway`. Mounts
     * `POST /eve/v1/discord/gateway`.
     */
    readonly gateway?: DiscordGatewayConfig;
    readonly events?: DiscordChannelEvents;
}
/** Low-level Discord handle exposed to hooks and event handlers. */
export interface DiscordHandle {
    /** Discord application id when known. */
    readonly applicationId: string | undefined;
    /** Discord channel id. */
    readonly channelId: string;
    /** Current eve conversation id, usually the Discord anchor message id. */
    readonly conversationId: string;
    /** Discord guild id when known. */
    readonly guildId: string | undefined;
    /** Latest Discord interaction token when known. */
    readonly interactionToken: string | undefined;
    /** Raw Discord API escape hatch. */
    request(path: string, body: JsonObject, options?: DiscordRequestOptions): Promise<DiscordApiResponse>;
    /** Posts to the current conversation: interaction response or followup when an interaction token and application id exist, else a channel message. Splits over-length content, returning the first. */
    post(message: string | DiscordMessageBody): Promise<DiscordPostedMessage>;
    /** Sends a bot-authenticated message to this Discord channel. */
    sendChannelMessage(message: string | DiscordMessageBody): Promise<DiscordPostedMessage>;
    /** Edits the deferred original interaction response. */
    editOriginalResponse(message: string | DiscordMessageBody): Promise<DiscordPostedMessage>;
    /** Creates an interaction followup message. */
    followup(message: string | DiscordMessageBody): Promise<DiscordPostedMessage>;
    /** Triggers Discord's short-lived typing indicator. Ignores any failure. */
    startTyping(): Promise<void>;
}
/** Options for {@link DiscordHandle.request}. */
export interface DiscordRequestOptions {
    /** When `true`, attaches bot-token authorization; otherwise the raw request runs unauthenticated, suiting interaction webhook endpoints. */
    readonly botAuth?: boolean;
    /** HTTP method for the raw request. Defaults to `POST`. */
    readonly method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
}
/** Concrete return type of {@link discordChannel}. */
export interface DiscordChannel extends Channel<DiscordChannelState, DiscordReceiveTarget, DiscordInstrumentationMetadata> {
}
/**
 * Discord channel factory for HTTP Interactions, proactive channel messages,
 * and, with `gateway`, ordinary messages forwarded from the Discord Gateway.
 */
export declare function discordChannel(config?: DiscordChannelConfig): DiscordChannel;
