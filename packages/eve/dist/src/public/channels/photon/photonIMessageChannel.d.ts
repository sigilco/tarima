import type { SessionAuthContext, TurnPolicy } from "#channel/types.js";
import type { SessionHistoryMessage } from "#shared/session-history.js";
import { type ChatSdkChannel, type ChatSdkChannelEvents } from "#public/channels/chat-sdk/index.js";
import { type IMessageTapback, type IMessageTapbackContext, type IMessageTapbackResult, type IMessageTapbackToolInput } from "#public/channels/imessage-tapbacks.js";
import type { ToolDefinition } from "#public/tools/index.js";
import type { Message, Thread } from "#compiled/chat/index.js";
import { type iMessageAdapter } from "#compiled/@photon-ai/chat-adapter-imessage/index.js";
/** Lazily resolves the Photon project credentials used by {@link photonIMessageChannel}. */
export type PhotonIMessageChannelCredentials = () => PhotonProjectCredentials | Promise<PhotonProjectCredentials>;
/** A Photon project's ID and secret. */
export interface PhotonProjectCredentials {
    readonly projectId: string;
    readonly projectSecret: string;
}
/**
 * Verifies a webhook forwarded by a trusted provider such as Vercel Connect, given the request
 * and its raw body. Return a falsy value or throw to reject the request; return a string to
 * replace the body eve parses.
 */
export type PhotonIMessageWebhookVerifier = (request: Request, rawBody: string) => unknown;
/** Context passed to {@link PhotonIMessageChannelConfig.onMessage}. */
export interface PhotonInboundMessageContext {
    /** Low-level Chat SDK thread for iMessage-specific operations. */
    readonly thread: Thread;
}
/** Result of {@link PhotonIMessageChannelConfig.onMessage}. Return `null` to drop the message. */
export type PhotonInboundResult = {
    readonly auth: SessionAuthContext | null;
    readonly context?: readonly string[];
    /** Prior conversation added as user and assistant turns before this message. */
    readonly history?: readonly SessionHistoryMessage[];
    /** Overrides the workflow run title without changing the message sent to the model. */
    readonly title?: string;
} | null;
/** Sync or async {@link PhotonInboundResult}. */
/** Configuration for {@link photonIMessageChannel}. */
export interface PhotonIMessageChannelConfig {
    /** Lazy Photon project credentials, such as `connectPhotonCredentials(...)`. */
    readonly credentials: PhotonIMessageChannelCredentials;
    /** Per-event overrides for the underlying Chat SDK channel. */
    readonly events?: ChatSdkChannelEvents<{
        imessage: iMessageAdapter;
    }>;
    /** Inbound message policy. Defaults to dispatching with the Photon message author's user auth. */
    readonly onMessage?: (ctx: PhotonInboundMessageContext, message: Message) => PhotonInboundResult | Promise<PhotonInboundResult>;
    /**
     * Inbound tapback policy. Tapbacks are ignored by default. Return a result to
     * send the tapback to the agent as a message such as `Tapback: Loved “See you at 7”`,
     * or `null` to ignore it.
     */
    readonly onTapback?: (ctx: IMessageTapbackContext, tapback: IMessageTapback) => IMessageTapbackResult | Promise<IMessageTapbackResult>;
    /** Override the default webhook route (`/eve/v1/photon`). */
    readonly route?: string;
    /** Policy for accepted messages that arrive while a turn is active. */
    readonly turnPolicy?: TurnPolicy;
    /** Display name used by the Chat SDK runtime. Defaults to `"eve"`. */
    readonly userName?: string;
    /** Photon webhook signing secret. Falls back to `IMESSAGE_WEBHOOK_SECRET`. */
    readonly webhookSecret?: string;
    /** Trusted webhook verifier. Takes precedence over `webhookSecret`. */
    readonly webhookVerifier?: PhotonIMessageWebhookVerifier;
}
/** First-class eve channel backed by Photon iMessage. */
export interface PhotonIMessageChannel extends ChatSdkChannel {
    /**
     * Returns a tool that lets the model react to the latest message in the
     * conversation with a tapback. Export it from a file in `agent/tools/`.
     */
    tapbackTool(): ToolDefinition<IMessageTapbackToolInput, string>;
}
/**
 * Creates an eve channel for Photon-powered iMessage.
 *
 * @example
 * ```ts
 * import { connectPhotonCredentials } from "@vercel/connect/eve";
 * import { photonIMessageChannel } from "eve/channels/photon";
 *
 * export default photonIMessageChannel({
 *   credentials: connectPhotonCredentials("photon/my-agent"),
 * });
 * ```
 */
export declare function photonIMessageChannel(config: PhotonIMessageChannelConfig): PhotonIMessageChannel;
/** Default Photon auth projection for inbound Chat SDK message authors. */
export declare function defaultPhotonAuth(message: Pick<Message, "author">): SessionAuthContext;
