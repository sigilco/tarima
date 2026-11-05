import type { SlackRequest } from "#public/channels/slack/code-channel.js";
import type { SlackMessage } from "#public/channels/slack/inbound.js";
/** Slack profile fields `messageContext.users` adds to a message's sender. */
export interface SlackUserInfo {
    /** Rendered as the sender's `display_name`. Kept unless `messageContext.users.name` is `false`. */
    readonly displayName?: string;
    /** Rendered as the sender's `real_name`, and set as `message.author.fullName`. Kept unless `name` is `false`. */
    readonly realName?: string;
    /** Rendered as the sender's `email`. Kept only with `messageContext.users.email`. */
    readonly email?: string;
}
/** The `messageContext.users` option of `slackChannel()`. */
export type SlackUsersOption = boolean | {
    /**
     * Adds each sender's display and real names. Defaults to `true`; set
     * `false` with `email: true` to add emails only.
     */
    readonly name?: boolean;
    /** Adds each sender's email. Needs the `users:read.email` scope. */
    readonly email?: boolean;
    /**
     * Resolves one user, for example from your own cache. `next()` is eve's
     * uncached `users.info` call and throws when Slack rejects it. Return
     * `undefined` to leave the user's profile fields out.
     */
    readonly resolve?: (user: {
        readonly userId: string;
        /**
         * Workspace whose app installation received the message, falling
         * back to the message's team: `message.installationTeamId ??
         * message.teamId`. Slack user ids are scoped to it, so key caches on
         * it rather than on `message.teamId`.
         */
        readonly teamId: string | undefined;
    }, next: () => Promise<SlackUserInfo>) => Promise<SlackUserInfo | undefined>;
};
/** Looks up Slack users for one channel. Never throws; a failure resolves to `undefined`. */
export type SlackUserResolver = (input: {
    readonly userId: string;
    readonly teamId: string | undefined;
    readonly request: SlackRequest;
}) => Promise<SlackUserInfo | undefined>;
/**
 * Builds the resolver for `messageContext.users`, or `undefined` when it adds
 * no fields. Without an authored `resolve`, `users.info` results are cached in
 * memory per workspace and user for an hour, and failures for a minute. Each
 * Slack channel builds its own, so a profile fetched with one app's scopes
 * never reaches another app in the same process.
 */
export declare function createSlackUserResolver(option: SlackUsersOption | undefined, now?: () => number): SlackUserResolver | undefined;
/**
 * Resolves each distinct user, the first {@link MAX_LOOKUPS_PER_MESSAGE} only.
 * A failed or empty lookup leaves that user out of the map.
 */
export declare function resolveSlackUsers(resolver: SlackUserResolver, input: {
    readonly userIds: readonly string[];
    readonly teamId: string | undefined;
    readonly request: SlackRequest;
}): Promise<ReadonlyMap<string, SlackUserInfo>>;
/** Returns `message` with its human author's resolved profile fields, or unchanged. */
export declare function withSlackUserInfo(message: SlackMessage, resolver: SlackUserResolver, input: {
    readonly teamId: string | undefined;
    readonly request: SlackRequest;
}): Promise<SlackMessage>;
