import { LinqAPIV3 } from "@linqapp/sdk";
import { Message } from "#compiled/chat/index.js";
import type { Adapter, AdapterPostableMessage, Attachment, ChatInstance, EmojiValue, FetchOptions, FetchResult, FormattedContent, RawMessage, StreamChunk, ThreadInfo, WebhookOptions } from "#compiled/chat/index.js";
import { type LinqRawMessage } from "./message-parser.js";
/** Delivery outcome Linq reported for an outbound message. */
export type LinqDeliveryStatus = "sent" | "delivered" | "read" | "failed";
/** A delivery-status change for a message this adapter sent. */
export interface LinqDeliveryStatusEvent {
    readonly status: LinqDeliveryStatus;
    readonly threadId: string;
    readonly messageId: string;
    /** Present on `failed`, carrying Linq's error code and message. */
    readonly error?: {
        readonly code?: number;
        readonly message?: string;
    };
    /** The raw webhook envelope, for anything this shape does not carry. */
    readonly raw: unknown;
}
/** Receives delivery-status changes. Return value is ignored. */
export type LinqDeliveryStatusListener = (event: LinqDeliveryStatusEvent) => void;
/** Linq-native send options with no Chat SDK equivalent. */
export interface LinqSendOptions {
    /**
     * Decorations appended to the ones derived from the message's markdown.
     * The only way to reach animations and underline, which markdown cannot
     * express. iMessage only; SMS/RCS recipients see plain text.
     */
    readonly textDecorations?: LinqAPIV3.TextDecoration[];
    /**
     * Dedupes retries of the same logical send. Must be stable across retries
     * to have any effect — a per-call value dedupes nothing. Max 255 chars.
     */
    readonly idempotencyKey?: string;
}
type LinqThreadId = {
    chatId: string;
    isGroup?: boolean;
    /** Target handle for a thread opened before its chat exists. See `openDM`. */
    pendingHandle?: string;
};
/** Credentials for Linq's outbound API and direct signed webhooks. */
export interface LinqCredentials {
    apiKey: string;
    /** Required only when direct Linq HMAC verification is in use. */
    signingSecret?: string;
}
/** Resolves credentials lazily, including from a managed credential store. */
export type LinqCredentialProvider = () => LinqCredentials | Promise<LinqCredentials>;
/**
 * Verifies a trusted, forwarded webhook. Throw (or return `false`) to reject
 * the request. It takes precedence over Linq's direct HMAC verification.
 */
export type LinqWebhookVerifier = (request: Request, rawBody: Uint8Array) => unknown | Promise<unknown>;
export interface LinqAdapterConfig {
    /** Direct API key. Use with `signingSecret`, or prefer lazy `credentials`. */
    apiKey?: string;
    baseURL?: string;
    /** Lazy credentials, for example from an externally managed credential store. */
    credentials?: LinqCredentialProvider;
    /** Direct webhook signing secret. Ignored when `webhookVerifier` is supplied. */
    signingSecret?: string;
    /** Trusted webhook verifier for managed webhook forwarding. */
    webhookVerifier?: LinqWebhookVerifier;
}
declare class LinqAdapter implements Adapter<LinqThreadId, LinqRawMessage> {
    readonly name: string;
    readonly userName: string;
    private apiClient;
    private readonly baseURL;
    private readonly converter;
    private readonly credentials;
    private readonly signingSecret;
    private readonly webhookVerifier;
    private chat;
    private logger;
    private readonly chatKinds;
    private readonly deliveryStatusListeners;
    constructor(config: LinqAdapterConfig);
    private getApiClient;
    private getSigningSecret;
    initialize(chat: ChatInstance): Promise<void>;
    encodeThreadId(platformData: LinqThreadId): string;
    decodeThreadId(threadId: string): LinqThreadId;
    fetchMessages(threadId: string, options?: FetchOptions): Promise<FetchResult<LinqRawMessage>>;
    fetchMessage(_threadId: string, messageId: string): Promise<Message<LinqRawMessage> | null>;
    postMessage(threadId: string, message: AdapterPostableMessage, options?: LinqSendOptions): Promise<RawMessage<LinqRawMessage>>;
    /**
     * Decodes a thread ID for an operation that needs an existing Linq chat.
     *
     * A thread from `openDM` has none until its first message, so anything other
     * than posting fails here with the remedy rather than a confusing API error.
     */
    private requireChatId;
    openDM(handle: string): Promise<string>;
    editMessage(threadId: string, messageId: string, message: AdapterPostableMessage): Promise<RawMessage<LinqRawMessage>>;
    deleteMessage(_threadId: string, _messageId: string): Promise<void>;
    addReaction(_threadId: string, messageId: string, emoji: EmojiValue | string): Promise<void>;
    removeReaction(_threadId: string, messageId: string, emoji: EmojiValue | string): Promise<void>;
    fetchThread(threadId: string): Promise<ThreadInfo>;
    startTyping(threadId: string, _status?: string): Promise<void>;
    /** Marks all messages in the Linq chat as read. */
    markRead(threadId: string, _messageId: string): Promise<void>;
    stream(threadId: string, textStream: AsyncIterable<string | StreamChunk>): Promise<RawMessage<LinqRawMessage>>;
    handleWebhook(request: Request, options?: WebhookOptions): Promise<Response>;
    private verifyTrustedWebhook;
    /**
     * Subscribes to delivery-status changes for outbound messages.
     *
     * Chat SDK has no delivery-status dispatch, so this surfaces on the adapter.
     * Reach it from a Chat SDK app with `bot.getAdapter("linq")`, which keeps the
     * concrete adapter type. Without it a caller cannot distinguish a delivered
     * message from one the carrier rejected.
     *
     * @returns a function that removes the listener.
     */
    onDeliveryStatus(listener: LinqDeliveryStatusListener): () => void;
    private emitDeliveryStatus;
    private processDeliveryStatusWebhook;
    private processReactionWebhook;
    parseMessage(raw: LinqRawMessage): Message<LinqRawMessage>;
    rehydrateAttachment(attachment: Attachment): Attachment;
    renderFormatted(content: FormattedContent): string;
    channelIdFromThreadId(threadId: string): string;
    isDM(threadId: string): boolean;
}
export declare function createLinqAdapter(config: LinqAdapterConfig): LinqAdapter;
export {};
//# sourceMappingURL=adapter.d.ts.map