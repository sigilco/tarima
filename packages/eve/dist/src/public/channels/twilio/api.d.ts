import type { TwilioChannelCredentials } from "#public/channels/twilio/credentials.js";
export type { TwilioChannelCredentials } from "#public/channels/twilio/credentials.js";
import { type TwilioApiResponse, type TwilioCredential, type TwilioFetch } from "#compiled/@chat-adapter/twilio/api.js";
import type { FetchFileResult } from "#channel/adapter.js";
/**
 * Builds the Twilio channel-local continuation token (`<from>:<to>`).
 * Eve namespaces this with the channel name before handing it to the runtime.
 */
export declare function twilioContinuationToken({ from, to, }: {
    readonly from: string;
    readonly to?: string | undefined;
}): string;
/** Twilio Account SID, materialized directly or from an async secret provider. */
export type TwilioAccountSid = TwilioCredential;
export type { TwilioApiResponse, TwilioFetch };
/** Credentials used for Twilio REST API calls and webhook verification. */
/** Shared Twilio REST API options. */
export interface TwilioApiOptions {
    readonly credentials?: TwilioChannelCredentials;
    readonly apiBaseUrl?: string;
    readonly fetch?: TwilioFetch;
}
/** Parameters for creating an outbound Twilio message. */
export interface TwilioSendMessageInput extends TwilioApiOptions {
    readonly to: string;
    readonly body: string;
    readonly from?: string;
    readonly messagingServiceSid?: string;
    readonly statusCallbackUrl?: string;
}
/** Parameters for updating a live Twilio call with new TwiML. */
export interface TwilioUpdateCallInput extends TwilioApiOptions {
    readonly callSid: string;
    readonly twiml: string;
}
/** Resolves a Twilio Account SID, falling back to `TWILIO_ACCOUNT_SID`. */
export declare function resolveTwilioAccountSid(accountSid?: TwilioAccountSid): Promise<string>;
/**
 * Calls Twilio's REST API with Basic auth and form-encoded body fields.
 *
 * The return shape intentionally preserves Eve's previous non-throwing HTTP
 * behavior: non-2xx Twilio responses become `{ ok: false, status, body }`.
 */
export declare function callTwilioApi(input: {
    readonly credentials?: TwilioChannelCredentials;
    readonly apiBaseUrl?: string;
    readonly fetch?: TwilioFetch;
    readonly path: string;
    readonly body: Readonly<Record<string, string | number | boolean | undefined | null>>;
}): Promise<TwilioApiResponse>;
/** Sends an outbound SMS/MMS-style message via Twilio's Messages resource. */
export declare function sendTwilioMessage(input: TwilioSendMessageInput): Promise<TwilioApiResponse>;
/** Updates a live Twilio call by posting replacement TwiML to the Calls resource. */
export declare function updateTwilioCall(input: TwilioUpdateCallInput): Promise<TwilioApiResponse>;
/**
 * Creates the channel's `fetchFile` for MMS media. Downloads URLs on the Twilio
 * API origin with the account's Basic auth, and returns `null` for any other
 * URL so it never receives the credentials.
 */
export declare function createTwilioFetchFile(input: TwilioApiOptions): (url: string) => Promise<FetchFileResult | null>;
