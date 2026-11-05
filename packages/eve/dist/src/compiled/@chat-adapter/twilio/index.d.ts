import { T as TwilioWebhookPayload, a as TwilioWebhookUrl, b as TwilioWebhookVerifier, c as TwilioMediaPayload, d as TwilioChannelMetadata } from './types-BaIqtt65.js';
export { e as TwilioChannel, i as inferTwilioChannel, f as isRcsAddress, g as isRcsCapableSender, n as normalizeRcsSenderId, r as resolveInboundThreadSender } from './types-BaIqtt65.js';
import { BaseFormatConverter, Root, AdapterPostableMessage, Logger, CardElement, Adapter, ChatInstance, WebhookOptions, RawMessage, Message, FetchOptions, FetchResult, ThreadInfo, UserInfo, FormattedContent, Attachment } from '#compiled/chat/index.js';
import { TwilioMessageResource, TwilioCredential, TwilioFetch, TwilioApiOptions } from './api.js';

declare class TwilioFormatConverter extends BaseFormatConverter {
    toAst(text: string): Root;
    fromAst(ast: Root): string;
    renderPostable(message: AdapterPostableMessage): string;
}

interface TwilioThreadId {
    recipient: string;
    sender: string;
}
interface TwilioAdapterConfig {
    accountSid?: TwilioCredential;
    apiUrl?: string;
    authToken?: TwilioCredential;
    contentApiUrl?: string;
    fetch?: TwilioFetch;
    logger?: Logger;
    messagingServiceSid?: string;
    phoneNumber?: string;
    rcsSenderId?: string;
    statusCallbackUrl?: string;
    userName?: string;
    webhookUrl?: TwilioWebhookUrl;
    webhookVerifier?: TwilioWebhookVerifier;
}
interface TwilioTemplateMessage {
    contentSid: string;
    contentVariables?: Record<string, string> | string;
}
type TwilioRawMessage = TwilioMessageResource | TwilioWebhookPayload;

declare function encodeTwilioCallbackData(actionId: string, value?: string): string;
declare function decodeTwilioCallbackData(data?: string): {
    actionId: string;
    value: string | undefined;
};

type TwilioRcsContentResult = {
    contentBody: TwilioContentBody;
    type: "content";
} | {
    text: string;
    type: "text";
};
interface TwilioContentBody {
    friendly_name?: string;
    language: string;
    types: Record<string, unknown>;
    variables?: Record<string, string>;
}

declare function cardToTwilioText(card: CardElement): string;
declare function cardToTwilioRcs(card: CardElement): TwilioRcsContentResult;

declare class TwilioAdapter implements Adapter<TwilioThreadId, TwilioRawMessage> {
    readonly name = "twilio";
    readonly lockScope: "thread";
    readonly persistThreadHistory = true;
    readonly userName: string;
    protected chat: ChatInstance | null;
    protected readonly accountSid?: TwilioAdapterConfig["accountSid"];
    protected readonly apiUrl?: string;
    protected readonly authToken?: TwilioAdapterConfig["authToken"];
    protected readonly contentApiUrl?: string;
    protected readonly fetch?: TwilioAdapterConfig["fetch"];
    protected readonly formatConverter: TwilioFormatConverter;
    protected readonly logger: Logger;
    protected readonly messagingServiceSid?: string;
    protected readonly phoneNumber?: string;
    protected readonly rcsSenderId?: string;
    protected readonly statusCallbackUrl?: string;
    protected readonly webhookUrl?: TwilioAdapterConfig["webhookUrl"];
    protected readonly webhookVerifier?: TwilioAdapterConfig["webhookVerifier"];
    constructor(config?: TwilioAdapterConfig);
    initialize(chat: ChatInstance): Promise<void>;
    handleWebhook(request: Request, options?: WebhookOptions): Promise<Response>;
    protected handleButtonAction(payload: TwilioWebhookPayload & {
        kind: "action";
    }, options?: WebhookOptions): void;
    postMessage(threadId: string, message: AdapterPostableMessage): Promise<RawMessage<TwilioRawMessage>>;
    /**
     * Send a pre-created Twilio Content API template by its ContentSid.
     *
     * Use this for approved WhatsApp templates, which are the only message
     * WhatsApp accepts outside the 24-hour customer service window, or for
     * RCS templates you manage yourself. The send is routed like
     * `postMessage`: `MG…` senders use `MessagingServiceSid`, everything else
     * uses `From`, so WhatsApp threads need a `whatsapp:` sender or a
     * Messaging Service with a WhatsApp sender.
     *
     * `contentVariables` takes an object keyed by placeholder, or a
     * pre-serialized JSON object string. Quick-reply taps on templates sent
     * this way are not decoded as Chat SDK actions: taps that carry a message
     * body arrive as regular messages, and taps without one reach `onAction`
     * with the raw ButtonPayload as `actionId`.
     *
     * @example
     * ```typescript
     * const threadId = adapter.encodeThreadId({
     *   sender: "whatsapp:+15550000001",
     *   recipient: "whatsapp:+15551234567",
     * });
     * await adapter.sendTemplate(threadId, {
     *   contentSid: "HXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
     *   contentVariables: { "1": "Tomorrow at 2pm" },
     * });
     * ```
     *
     * @see https://www.twilio.com/docs/content
     */
    sendTemplate(threadId: string, template: TwilioTemplateMessage): Promise<RawMessage<TwilioRawMessage>>;
    private sendContent;
    editMessage(): Promise<RawMessage<TwilioRawMessage>>;
    deleteMessage(_threadId: string, messageId: string): Promise<void>;
    addReaction(): Promise<void>;
    removeReaction(): Promise<void>;
    startTyping(): Promise<void>;
    parseMessage(raw: TwilioRawMessage): Message<TwilioRawMessage>;
    fetchMessage(threadId: string, messageId: string): Promise<Message<TwilioRawMessage> | null>;
    fetchMessages(threadId: string, options?: FetchOptions): Promise<FetchResult<TwilioRawMessage>>;
    fetchThread(threadId: string): Promise<ThreadInfo>;
    getUser(userId: string): Promise<UserInfo | null>;
    openDM(userId: string): Promise<string>;
    isDM(threadId: string): boolean;
    channelIdFromThreadId(threadId: string): string;
    encodeThreadId(platformData: TwilioThreadId): string;
    decodeThreadId(threadId: string): TwilioThreadId;
    renderFormatted(content: FormattedContent): string;
    rehydrateAttachment(attachment: Attachment): Attachment;
    protected parseTwilioTextPayload(raw: TwilioWebhookPayload & {
        kind: "text";
    }, threadId: string): Message<TwilioRawMessage>;
    protected parseTwilioResource(raw: TwilioMessageResource, fallbackThread: TwilioThreadId | undefined): Message<TwilioRawMessage>;
    protected renderPostableText(message: AdapterPostableMessage): string;
    protected mediaUrls(message: AdapterPostableMessage): string[];
    protected twilioAttachment(media: TwilioMediaPayload): Attachment;
    protected apiOptions(): TwilioApiOptions;
    protected defaultSender(): string;
    protected inboundThreadSender(payload: {
        channelMetadata?: TwilioChannelMetadata;
        messagingServiceSid?: string;
        to: string;
    }): string;
    protected author(userId: string, isMe: boolean): Message["author"];
    protected threadIdForResource(raw: TwilioMessageResource, fallback: TwilioThreadId): string;
}
declare function createTwilioAdapter(config?: TwilioAdapterConfig): TwilioAdapter;

export { TwilioAdapter, type TwilioAdapterConfig, TwilioChannelMetadata, type TwilioContentBody, TwilioFormatConverter, type TwilioRawMessage, type TwilioRcsContentResult, type TwilioTemplateMessage, type TwilioThreadId, cardToTwilioRcs, cardToTwilioText, createTwilioAdapter, decodeTwilioCallbackData, encodeTwilioCallbackData };
