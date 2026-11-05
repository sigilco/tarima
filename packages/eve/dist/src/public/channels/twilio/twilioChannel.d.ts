import type { TwilioChannelCredentials } from "#public/channels/twilio/credentials.js";
export type { TwilioChannelCredentials } from "#public/channels/twilio/credentials.js";
import type { ChannelEventContext, ChannelEventOf } from "#public/definitions/channel.js";
import type { SessionEvent } from "#protocol/session-event.js";
import type { PromptQueueState } from "#channel/prompt-queue.js";
import type { SessionAuthContext, TurnPolicy } from "#channel/types.js";
import type { ChannelContinuationOps } from "#public/definitions/channel.js";
import { type TwilioApiOptions, type TwilioApiResponse } from "#public/channels/twilio/api.js";
import { type TwilioTextMessage, type TwilioVoiceCall, type TwilioVoiceTranscription } from "#public/channels/twilio/inbound.js";
import { type TwilioWebhookUrl } from "#public/channels/twilio/verify.js";
import { type Channel } from "#public/definitions/channel.js";
/** Pre-dispatch Twilio context passed to the inbound text, voice, and voice-transcription hooks. */
export interface TwilioContext {
    readonly twilio: TwilioHandle;
}
/** Channel-owned Twilio context returned by `context()`. */
export interface TwilioChannelContext extends TwilioContext {
    state: TwilioChannelState;
}
/** Event-handler Twilio context, including continuation routing. */
export interface TwilioEventContext extends TwilioChannelContext, ChannelContinuationOps {
}
/** JSON-serializable state for the phone-number conversation. */
export interface TwilioChannelState extends PromptQueueState {
    /** Caller / sender phone number. */
    from: string | null;
    /** Twilio number or sender that received the latest session-starting webhook. */
    to: string | null;
    /** Most recent inbound SMS SID when this session was started by text. */
    lastMessageSid?: string | null;
    /** Most recent inbound Call SID when this session was started by voice. */
    lastCallSid?: string | null;
}
/** Per-session instrumentation snapshot for Twilio runtime telemetry. Reports the active phone-number pair and the most recent message and call SIDs. */
export interface TwilioInstrumentationMetadata extends Record<string, unknown> {
    readonly from: string | null;
    readonly lastCallSid: string | null;
    readonly lastMessageSid: string | null;
    readonly to: string | null;
}
/** Twilio channel credentials. `authToken` also verifies inbound webhook signatures. */
/** Target accepted by `receive(twilio, { target })` for proactive phone-number sessions. */
export interface TwilioReceiveTarget {
    readonly phoneNumber: string;
    /** Twilio sender included in the phone-pair continuation token. */
    readonly from?: string;
}
/** Result of an inbound Twilio text or transcription hook. Return `null` (or `undefined`) to drop the webhook without dispatching; otherwise supply the session `auth` context. */
export type TwilioInboundResult = {
    auth: SessionAuthContext | null;
    /** Overrides the workflow run title without changing the message sent to the model. */
    title?: string;
} | null;
/** Sync or async {@link TwilioInboundResult}. */
/** Phone-number allow list for inbound Twilio webhook triggers. `"*"` allows every sender. */
export type TwilioAllowFrom = string | readonly string[] | (() => string | readonly string[] | Promise<string | readonly string[]>);
/**
 * Result of an inbound Twilio voice hook. Return `null` to reject the call.
 * Any result other than `null` accepts the call and can override the answering TwiML.
 */
export interface TwilioVoiceResult {
    /** Prompt spoken before Twilio starts speech recognition. */
    readonly prompt?: string;
    /** BCP 47 language used for speech recognition and the nested `<Say>` prompt. */
    readonly language?: string;
    /** Twilio `<Say voice>` used for the prompt, e.g. `Polly.Joanna-Neural`. */
    readonly voice?: string;
    /** Twilio `<Gather speechModel>` used for speech recognition. */
    readonly speechModel?: string;
    /** Twilio `<Gather timeout>` in seconds. */
    readonly timeoutSeconds?: number;
    /** Twilio `<Gather speechTimeout>`, such as `"auto"` or a second count string. */
    readonly speechTimeout?: string;
    /** Twilio `<Gather hints>` for expected words or phrases. */
    readonly hints?: string | readonly string[];
    /** Twilio `<Gather profanityFilter>` toggle. */
    readonly profanityFilter?: boolean;
}
/** Sync or async {@link TwilioVoiceResult}. */
type TwilioEventHandler<T extends SessionEvent["type"]> = (event: ChannelEventOf<T>, ctx: ChannelEventContext<TwilioEventContext>) => void | Promise<void>;
/** Event handlers supported by `twilioChannel({ events })`. */
export interface TwilioChannelEvents {
    readonly "turn.started"?: TwilioEventHandler<"turn.started">;
    readonly "call.requested"?: TwilioEventHandler<"call.requested">;
    readonly "call.progress"?: TwilioEventHandler<"call.progress">;
    readonly "call.settled"?: TwilioEventHandler<"call.settled">;
    readonly "content.completed"?: TwilioEventHandler<"content.completed">;
    readonly "content.delta"?: TwilioEventHandler<"content.delta">;
    readonly "interaction.opened"?: TwilioEventHandler<"interaction.opened">;
    readonly "interaction.settled"?: TwilioEventHandler<"interaction.settled">;
    readonly "response.admitted"?: TwilioEventHandler<"response.admitted">;
    readonly "turn.settled"?: TwilioEventHandler<"turn.settled">;
    readonly "session.ended"?: TwilioEventHandler<"session.ended">;
    readonly "delivery.settled"?: TwilioEventHandler<"delivery.settled">;
}
/** SMS/Messaging defaults for Twilio outbound replies. */
export interface TwilioMessagingConfig {
    /** Sender phone number. Defaults to the inbound `To` number when available. */
    readonly from?: string;
    /** Messaging Service SID. Used instead of `from` when supplied. */
    readonly messagingServiceSid?: string;
    /** Optional Twilio status callback URL for outbound messages. */
    readonly statusCallbackUrl?: string;
}
/** Voice webhook defaults for accepting calls and gathering speech. */
export interface TwilioVoiceConfig {
    /** Prompt spoken when a caller reaches the voice route. */
    readonly prompt?: string;
    /** Twilio `<Say voice>` used for the prompt, e.g. `Polly.Joanna-Neural`. */
    readonly voice?: string;
    /** Spoken acknowledgement after a transcription webhook is accepted. */
    readonly acknowledgement?: string;
    /** BCP 47 language used for speech recognition and the nested `<Say>` prompt. */
    readonly language?: string;
    /** Twilio `<Gather speechModel>` used for speech recognition. */
    readonly speechModel?: string;
    /** Twilio `<Gather timeout>` in seconds. */
    readonly timeoutSeconds?: number;
    /** Twilio `<Gather speechTimeout>`, such as `"auto"` or a second count string. */
    readonly speechTimeout?: string;
    /** Twilio `<Gather hints>` for expected words or phrases. */
    readonly hints?: string | readonly string[];
    /** Twilio `<Gather profanityFilter>` toggle. */
    readonly profanityFilter?: boolean;
}
/** Configuration for {@link twilioChannel}. */
export interface TwilioChannelConfig {
    readonly credentials?: TwilioChannelCredentials;
    /**
     * Base route for Twilio webhooks. Defaults to `/eve/v1/twilio` and
     * mounts `/messages`, `/voice`, and `/voice/transcription` below it.
     */
    readonly route?: string;
    /** Policy for accepted messages that arrive while a turn is active. */
    readonly turnPolicy?: TurnPolicy;
    /**
     * Public URL Twilio used for signing. Set this when proxies or local
     * tunnels make `request.url` differ from the configured webhook URL.
     */
    readonly webhookUrl?: TwilioWebhookUrl;
    /** Public base URL used to render absolute voice `<Gather action>` URLs. */
    readonly publicBaseUrl?: string | ((request: Request) => string | Promise<string>);
    /**
     * Exact caller/sender numbers allowed to reach inbound hooks, or `"*"` to
     * allow every verified Twilio sender. Resolvers run on each inbound webhook.
     */
    readonly allowFrom: TwilioAllowFrom;
    readonly messaging?: TwilioMessagingConfig;
    readonly voice?: TwilioVoiceConfig;
    readonly api?: Omit<TwilioApiOptions, "credentials">;
    /** Inbound text hook. Defaults to phone-number auth and dispatch. */
    onText?(ctx: TwilioContext, message: TwilioTextMessage): TwilioInboundResult | Promise<TwilioInboundResult>;
    /** Inbound voice hook. Return `null` to reject the call before gathering speech. */
    onVoice?(ctx: TwilioContext, call: TwilioVoiceCall): TwilioVoiceResult | null | undefined | Promise<TwilioVoiceResult | null | undefined>;
    /** Inbound voice transcription hook. Defaults to phone-number auth and dispatch. */
    onVoiceTranscription?(ctx: TwilioContext, transcription: TwilioVoiceTranscription): TwilioInboundResult | Promise<TwilioInboundResult>;
    readonly events?: TwilioChannelEvents;
}
/** Low-level Twilio handle exposed to hooks and event handlers. */
export interface TwilioHandle {
    /** Caller / sender phone number bound to this conversation. */
    readonly from: string;
    /** Twilio receiver / sender number for replies, when known. */
    readonly to: string | undefined;
    /** Most recent call SID, when the session started from a voice transcription. */
    readonly callSid: string | undefined;
    /** Raw Twilio REST API escape hatch. `path` is appended to the API base URL (default `https://api.twilio.com`). `body` fields are POSTed as form-encoded parameters. */
    request(path: string, body: Readonly<Record<string, string | number | boolean | undefined | null>>): Promise<TwilioApiResponse>;
    /** Sends a text message to this conversation's phone number by default. */
    sendMessage(message: string, options?: TwilioSendMessageOptions): Promise<TwilioApiResponse>;
    /** Updates a live call with replacement TwiML. */
    updateCall(callSid: string, twiml: string): Promise<TwilioApiResponse>;
}
/** Per-call overrides for {@link TwilioHandle.sendMessage}. */
export interface TwilioSendMessageOptions {
    /** Recipient phone number. Defaults to the conversation's `from` number. */
    readonly to?: string;
    /** Sender phone number. Defaults to `messaging.from`, falling back to the inbound `To` number. */
    readonly from?: string;
    /** Messaging Service SID. Defaults to `messaging.messagingServiceSid`. */
    readonly messagingServiceSid?: string;
    /** Twilio status callback URL. Defaults to `messaging.statusCallbackUrl`. */
    readonly statusCallbackUrl?: string;
}
/** Concrete return type of {@link twilioChannel}. */
export interface TwilioChannel extends Channel<TwilioChannelState, TwilioReceiveTarget, TwilioInstrumentationMetadata> {
}
/** Twilio channel factory for SMS and speech-transcribed inbound calls. */
export declare function twilioChannel(config: TwilioChannelConfig): TwilioChannel;
