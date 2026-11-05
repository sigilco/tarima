import type { SlackApiResponse } from "#public/channels/slack/api.js";
export type SlackRequest = (operation: string, body: unknown) => Promise<SlackApiResponse>;
/**
 * Whether the conversation is a code channel. A failed lookup counts as not a
 * code channel, so its messages get per-thread sessions until a retry
 * succeeds a minute later.
 */
export declare function isSlackCodeChannel(channelId: string, request: SlackRequest): Promise<boolean>;
/**
 * Opens a code channel from an origin message. Slack invites the origin
 * message's author, links the channel in the origin thread, and refuses Slack
 * Connect origins. `session_id` makes the call idempotent, so a retry with the
 * same origin and requester returns the same channel. Throws an error marked
 * `fatal` when Slack refuses permanently, so the calling step doesn't retry.
 *
 * eve reads the origin before creating anything and asks for a private
 * channel when the origin is private. Slack always honors an explicit
 * `is_private`, so the check after creation is a backstop: on a mismatch eve
 * archives the channel and throws.
 */
export declare function createSlackCodeChannel(input: {
    readonly name: string;
    readonly originChannelId: string;
    readonly originTs: string;
    /** Principal the channel is opened for; one channel per requester and origin message. */
    readonly requester: string;
    readonly request: SlackRequest;
}): Promise<{
    readonly channelId: string;
    readonly isPrivate: boolean;
}>;
/**
 * Whether a message is the origin quote Slack posts when it creates a code
 * channel from a message. It is context, not a request.
 */
export declare function isSlackCodeChannelOriginContext(raw: Record<string, unknown>): boolean;
/** Slack agent session lifecycle states. */
export type SlackSessionStatus = "active" | "processing" | "suspended";
/** Sets a code channel's session status. Failures are logged, never thrown. */
export declare function setSlackCodeChannelStatus(request: SlackRequest, channelId: string, status: SlackSessionStatus): Promise<void>;
/** Slack's `thread_ts` for a session thread: omitted for top-level posts. */
export declare function slackThreadTsParam(threadTs: string): string | undefined;
