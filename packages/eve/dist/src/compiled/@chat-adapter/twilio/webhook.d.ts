import { T as TwilioWebhookPayload, a as TwilioWebhookUrl, h as TwilioVerifyOptions, j as TwilioVerifiedRequest, k as TwilioReadOptions } from './types-BaIqtt65.js';
export { l as TwilioActionPayload, m as TwilioHeaderValue, o as TwilioHeaders, c as TwilioMediaPayload, p as TwilioStatusPayload, q as TwilioTextPayload, s as TwilioUnsupportedPayload, t as TwilioWebhookError, u as TwilioWebhookParseError, v as TwilioWebhookVerificationError, b as TwilioWebhookVerifier } from './types-BaIqtt65.js';
import './api.js';

declare function parseTwilioWebhookBody(params: URLSearchParams): TwilioWebhookPayload;

declare function verifyTwilioRequest(request: Request, options?: TwilioVerifyOptions): Promise<TwilioVerifiedRequest>;
declare function signTwilioRequest(input: {
    authToken: string;
    params?: URLSearchParams | null;
    url: string;
}): Promise<string>;
declare function twilioSignatureBase(url: string, params?: URLSearchParams | null): string;
declare function resolveTwilioWebhookUrl(request: Request, webhookUrl: TwilioWebhookUrl | undefined): Promise<string>;

declare function readTwilioWebhook(request: Request, options?: TwilioReadOptions): Promise<TwilioWebhookPayload>;

export { TwilioReadOptions, TwilioVerifiedRequest, TwilioVerifyOptions, TwilioWebhookPayload, TwilioWebhookUrl, parseTwilioWebhookBody, readTwilioWebhook, resolveTwilioWebhookUrl, signTwilioRequest, twilioSignatureBase, verifyTwilioRequest };
