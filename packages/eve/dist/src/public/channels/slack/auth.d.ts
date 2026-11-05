import type { SessionAuthContext } from "#channel/types.js";
import type { SlackChannelState } from "#public/channels/slack/slackChannel.js";
interface SlackAuthContextInput {
    readonly channelId: string;
    readonly email?: string;
    readonly fullName?: string;
    /** Workspace whose app installation received the event. Keys the principal when known. */
    readonly installationTeamId?: string | null;
    readonly isBot?: boolean;
    readonly teamId?: string | null;
    /** Thread root ts; omit it in a code channel, which is one session across its threads. */
    readonly threadTs?: string;
    readonly userId: string;
    readonly userName?: string;
}
/** Returns the Slack user id carried by a Slack-derived auth context. */
export declare function slackUserIdFromAuthContext(auth: SessionAuthContext | null): string | undefined;
/** Returns the Slack user recorded for a principal, if one has been seen in this thread. */
export declare function slackUserIdForPrincipal(state: Pick<SlackChannelState, "slackUsersByPrincipal">, principalId: string | undefined): string | undefined;
/**
 * Builds the Slack-derived session auth context used by inbound
 * messages and signed interactivity callbacks.
 */
export declare function buildSlackAuthContext(input: SlackAuthContextInput): SessionAuthContext;
export {};
