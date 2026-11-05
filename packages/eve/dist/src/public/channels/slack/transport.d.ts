/**
 * The seam between eve and the vendored Slack transport: the host and fetch
 * every outbound call travels on, and the record of whether a thrown error
 * means Slack answered.
 */
import { type SlackApiOptions, type SlackApiResponse } from "#compiled/@chat-adapter/slack/api.js";
/** Fetch implementation used for Slack traffic. */
export type SlackFetch = typeof globalThis.fetch;
/**
 * Slack API transport overrides. The base URLs say where a call may go:
 * `apiBaseUrl` defaults to `https://slack.com/api/`, and `fileBaseUrl` falls back to
 * `apiBaseUrl` for attachment downloads. Both are absolute http or https URLs
 * carrying no query string or fragment.
 *
 * `fetch` says how the traffic travels: it replaces the global fetch, which attaches
 * the per-call header a host behind an authenticating proxy requires, and observes or
 * stubs the calls. It is confined to the configured bases' origins, so a wrapper may
 * attach a credential without checking each destination itself. With no base
 * configured every call goes to Slack's own hosts and it sees all of them.
 */
export interface SlackTransportOptions {
    readonly apiBaseUrl?: string;
    readonly fetch?: SlackFetch;
    readonly fileBaseUrl?: string;
}
/**
 * Checks the configured bases and resolves each to the directory href that method
 * names and file paths resolve against, throwing on one eve cannot reach.
 * `fileBaseUrl` absorbs its fallback here, `fetch` is confined here, and every
 * outbound call then reads a resolved string.
 *
 * Resolving an already-resolved value returns it unchanged, so `slackChannel()`
 * can resolve once at construction — where a bad base belongs — while an entry
 * point reached without a channel resolves for itself.
 */
export declare function resolveSlackTransportOptions(api: SlackTransportOptions | undefined): SlackTransportOptions | undefined;
/**
 * The options an outbound Slack Web API call is made with. Resolves `api`, so a
 * caller cannot reach the transport with a base that was never checked or a fetch
 * that was never confined.
 */
export declare function slackApiOptions(api: SlackTransportOptions | undefined, token: SlackApiOptions["token"]): SlackApiOptions;
/**
 * True when a configured file base serves `url`, which makes it downloadable with
 * the bot token. The match is a path prefix, so an `apiBaseUrl` of
 * `https://slack.com/api/` authorizes downloads under that path alone.
 */
export declare function isConfiguredSlackFileUrl(api: SlackTransportOptions | undefined, url: string): boolean;
/**
 * POSTs to a Slack Web API method and records the response arriving.
 *
 * Slack retries an interaction whose acknowledgement is not a 2xx, so a
 * handler answering a click has to swallow a call Slack answered badly
 * and rethrow a call that never arrived. Those two are indistinguishable
 * once thrown: the transport consumes the response body before it reads
 * the status, so a body cut off partway raises the same `TypeError` as a
 * connection that was never made. Nothing on the error says which it
 * was, so the answer is recorded here while the call runs. `callSlackApi`
 * posts through here, which covers `ctx.slack.request` and the
 * `views.open` that opens the freeform modal; the message, upload and
 * thread-fetch helpers in `api.ts` post through the vendored transport.
 *
 * The transport is handed a `fetch` that observes the response, so
 * everything thrown from that moment on — a non-2xx, a body that is not
 * the JSON envelope, a body cut off mid-read — is marked for
 * {@link isSlackResponseError}. A failure before then stays unmarked and
 * reaches the caller, which is what fails the interaction request.
 */
export declare function callSlackApiTrackingResponse(operation: string, body: Record<string, unknown>, options: SlackApiOptions): Promise<SlackApiResponse>;
/**
 * True when Slack answered the call, false when the call never got a
 * response. A caller that must acknowledge Slack swallows the first and
 * rethrows the second; see {@link callSlackApiTrackingResponse} for why
 * the error itself cannot be asked.
 */
export declare function isSlackResponseError(error: unknown): boolean;
