import { TwilioCredential } from './api.js';

type TwilioChannel = "rcs" | "sms" | "unknown" | "whatsapp";
interface TwilioChannelMetadata {
    type?: string;
    [key: string]: unknown;
}
declare function isRcsAddress(address: string): boolean;
declare function inferTwilioChannel(payload: {
    channelMetadata?: TwilioChannelMetadata;
    from?: string;
    to?: string;
}): TwilioChannel;
declare function isRcsCapableSender(sender: string): boolean;
declare function normalizeRcsSenderId(senderId: string): string;
declare function resolveInboundThreadSender(options: {
    channelMetadata?: TwilioChannelMetadata;
    messagingServiceSid?: string;
    messagingServiceSidConfig?: string;
    rcsSenderIdConfig?: string;
    to: string;
}): string;

type TwilioHeaderValue = readonly string[] | string | null | undefined;
type TwilioHeaders = Headers | Iterable<readonly [string, string]> | Record<string, TwilioHeaderValue>;
type TwilioWebhookUrl = string | ((request: Request) => Promise<string> | string);
type TwilioWebhookVerifier = (request: Request, body: string) => Promise<boolean | string> | boolean | string;
interface TwilioVerifyOptions {
    authToken?: TwilioCredential;
    webhookUrl?: TwilioWebhookUrl;
    webhookVerifier?: TwilioWebhookVerifier;
}
interface TwilioReadOptions extends TwilioVerifyOptions {
}
interface TwilioVerifiedRequest {
    body: string;
    params: URLSearchParams;
}
interface TwilioTextPayload {
    accountSid?: string;
    address?: string;
    body: string;
    channelMetadata?: TwilioChannelMetadata;
    from: string;
    label?: string;
    latitude?: string;
    longitude?: string;
    media: TwilioMediaPayload[];
    messageSid?: string;
    messagingServiceSid?: string;
    raw: URLSearchParams;
    to: string;
}
interface TwilioActionPayload {
    accountSid?: string;
    buttonPayload: string;
    buttonText?: string;
    channelMetadata?: TwilioChannelMetadata;
    from: string;
    messageSid?: string;
    messagingServiceSid?: string;
    raw: URLSearchParams;
    to: string;
}
interface TwilioStatusPayload {
    accountSid?: string;
    channelPrefix?: string;
    eventType?: string;
    from?: string;
    messageSid?: string;
    messageStatus: string;
    raw: URLSearchParams;
    to?: string;
}
interface TwilioUnsupportedPayload {
    kind: "unsupported";
    raw: URLSearchParams;
}
interface TwilioMediaPayload {
    contentType?: string;
    url: string;
}
type TwilioWebhookPayload = ({
    kind: "action";
} & TwilioActionPayload) | ({
    kind: "status";
} & TwilioStatusPayload) | ({
    kind: "text";
} & TwilioTextPayload) | TwilioUnsupportedPayload;
declare class TwilioWebhookError extends Error {
    constructor(message: string);
}
declare class TwilioWebhookParseError extends TwilioWebhookError {
    constructor(message: string);
}
declare class TwilioWebhookVerificationError extends TwilioWebhookError {
    constructor(message: string);
}

export { type TwilioWebhookPayload as T, type TwilioWebhookUrl as a, type TwilioWebhookVerifier as b, type TwilioMediaPayload as c, type TwilioChannelMetadata as d, type TwilioChannel as e, isRcsAddress as f, isRcsCapableSender as g, type TwilioVerifyOptions as h, inferTwilioChannel as i, type TwilioVerifiedRequest as j, type TwilioReadOptions as k, type TwilioActionPayload as l, type TwilioHeaderValue as m, normalizeRcsSenderId as n, type TwilioHeaders as o, type TwilioStatusPayload as p, type TwilioTextPayload as q, resolveInboundThreadSender as r, type TwilioUnsupportedPayload as s, TwilioWebhookError as t, TwilioWebhookParseError as u, TwilioWebhookVerificationError as v };
