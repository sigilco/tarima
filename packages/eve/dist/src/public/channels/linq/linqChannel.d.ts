import type { SessionAuthContext, TurnPolicy } from "#channel/types.js";
import type { SessionHistoryMessage } from "#shared/session-history.js";
import { type ChatSdkChannelEvents, type ChatSdkChannelState, type ChatSdkInstrumentationMetadata, type ChatSdkReceiveTarget } from "#public/channels/chat-sdk/index.js";
import type { Channel } from "#public/definitions/channel.js";
import { type IMessageTapback, type IMessageTapbackContext, type IMessageTapbackResult, type IMessageTapbackToolInput } from "#public/channels/imessage-tapbacks.js";
import type { ToolDefinition } from "#public/tools/index.js";
import { createLinqAdapter } from "#compiled/@linqapp/chat-sdk-adapter/index.js";
import type { Message, Thread } from "#compiled/chat/index.js";
/** Context passed to {@link LinqChannelConfig.onMessage}. */
export interface LinqInboundMessageContext {
    /** Low-level Chat SDK thread for Linq-specific operations. */
    readonly thread: Thread;
}
/** Result of {@link LinqChannelConfig.onMessage}. Return `null` to drop the message. */
export type LinqInboundResult = {
    readonly auth: SessionAuthContext | null;
    readonly context?: readonly string[];
    /** Prior conversation added as user and assistant turns before this message. */
    readonly history?: readonly SessionHistoryMessage[];
    /** Overrides the workflow run title without changing the message sent to the model. */
    readonly title?: string;
} | null;
/** Sync or async {@link LinqInboundResult}. */
/** A direct value or lazy resolver for a Linq credential. */
export type LinqCredentialValue = string | (() => string | Promise<string>);
/**
 * Verifies a webhook forwarded by a trusted provider such as Vercel Connect, given the request
 * and its raw body. Return a falsy value or throw to reject the request.
 */
export type LinqWebhookVerifier = (request: Request, rawBody: Uint8Array) => unknown;
/** Linq credentials for outbound API calls and inbound webhook verification. */
export interface LinqChannelCredentials {
    /** API key for outbound Linq API calls. */
    readonly apiKey?: LinqCredentialValue;
    /** Signing secret for direct Linq webhook delivery. */
    readonly signingSecret?: LinqCredentialValue;
    /** Trusted verifier for webhooks forwarded by a provider such as Vercel Connect. */
    readonly webhookVerifier?: LinqWebhookVerifier;
}
/** Configuration for {@link linqChannel}. */
export interface LinqChannelConfig {
    /** Optional Linq API base URL, for example a sandbox endpoint. */
    readonly baseURL?: string;
    /** Outbound credentials and inbound webhook verification. */
    readonly credentials?: LinqChannelCredentials;
    /** Per-event overrides for the underlying Chat SDK channel. */
    readonly events?: ChatSdkChannelEvents<{
        linq: ReturnType<typeof createLinqAdapter>;
    }>;
    /** Inbound message policy. Defaults to dispatching with the Linq message author's user auth. */
    readonly onMessage?: (ctx: LinqInboundMessageContext, message: Message) => LinqInboundResult | Promise<LinqInboundResult>;
    /**
     * Inbound tapback policy. Tapbacks are ignored by default. Return a result to
     * send the tapback to the agent as a message such as `Tapback: Loved “See you at 7”`,
     * or `null` to ignore it.
     */
    readonly onTapback?: (ctx: IMessageTapbackContext, tapback: IMessageTapback) => IMessageTapbackResult | Promise<IMessageTapbackResult>;
    /** Override the default webhook route (`/eve/v1/linq`). */
    readonly route?: string;
    /** Policy for accepted messages that arrive while a turn is active. */
    readonly turnPolicy?: TurnPolicy;
    /** Display name used by the Chat SDK runtime. Defaults to `"eve"`. */
    readonly userName?: string;
}
/** First-class eve channel backed by Linq iMessage and SMS. */
export interface LinqChannel extends Channel<ChatSdkChannelState, ChatSdkReceiveTarget, ChatSdkInstrumentationMetadata> {
    /**
     * Returns a tool that lets the model react to the latest message in the
     * conversation with a tapback. Export it from a file in `agent/tools/`.
     */
    tapbackTool(): ToolDefinition<IMessageTapbackToolInput, string>;
}
/**
 * Creates an eve channel for Linq-powered iMessage and SMS conversations.
 *
 * @example
 * ```ts
 * import { connectLinqCredentials } from "@vercel/connect/eve";
 * import { linqChannel } from "eve/channels/linq";
 *
 * export default linqChannel({
 *   credentials: connectLinqCredentials("linq/my-agent"),
 * });
 * ```
 */
export declare function linqChannel(config: LinqChannelConfig): LinqChannel;
/** Default Linq auth projection for inbound Chat SDK message authors. */
export declare function defaultLinqAuth(message: Pick<Message, "author">): SessionAuthContext;
