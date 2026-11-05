import type { ChannelEventContext, ChannelEventOf } from "#public/definitions/channel.js";
import type { SessionEvent } from "#protocol/session-event.js";
import type { SessionHistoryMessage } from "#shared/session-history.js";
import type { SessionAuthContext, TurnPolicy } from "#channel/types.js";
import type { ChannelContinuationOps } from "#public/definitions/channel.js";
import { type GitHubHandle, type GitHubThread } from "#public/channels/github/binding.js";
import { type GitHubApiOptions } from "#public/channels/github/api.js";
import { type GitHubBotName, type GitHubChannelCredentials } from "#public/channels/github/auth.js";
import { type GitHubCheckRunEvent, type GitHubCheckSuiteEvent, type GitHubComment, type GitHubConversationRef, type GitHubDelivery, type GitHubIssueEvent, type GitHubPullRequestEvent, type GitHubRepositoryRef, type GitHubUser, type GitHubWorkflowRunEvent } from "#public/channels/github/inbound.js";
import { type GitHubChannelState } from "#public/channels/github/state.js";
import type { GitHubPullRequestContextConfig } from "#public/channels/github/pr-context.js";
import { type Channel } from "#public/definitions/channel.js";
/**
 * Target accepted by `receive(github, { target })` for proactive sessions.
 * Requires `owner`, `repo`, and exactly one of `issueNumber` or
 * `pullRequestNumber`; supplying both numbers or neither throws.
 */
export interface GitHubReceiveTarget {
    readonly initialMessage?: string;
    readonly installationId?: number;
    readonly issueNumber?: number;
    readonly owner: string;
    readonly pullRequestNumber?: number;
    /** Optional shortcut that avoids a repository metadata API call. */
    readonly repositoryId?: number;
    readonly repo: string;
}
/** Optional acknowledgement progress surfaces for GitHub conversations. */
export interface GitHubProgressConfig {
    readonly reactions?: boolean;
}
/** Pre-dispatch GitHub context passed to inbound hooks. */
export interface GitHubInboundContext {
    readonly conversation: GitHubConversationRef;
    readonly delivery: GitHubDelivery;
    readonly github: GitHubHandle;
    readonly repository: GitHubRepositoryRef;
    readonly sender: GitHubUser;
    readonly thread: GitHubThread;
}
/** Channel-owned GitHub context rebuilt from persisted channel state. */
export interface GitHubChannelContext {
    readonly conversation: GitHubConversationRef;
    readonly github: GitHubHandle;
    readonly repository: GitHubRepositoryRef;
    readonly thread: GitHubThread;
    state: GitHubChannelState;
}
/** Event-handler GitHub context, including continuation routing. */
export interface GitHubEventContext extends GitHubChannelContext, ChannelContinuationOps {
}
/**
 * Result of a GitHub inbound hook. Return `null` to acknowledge without
 * dispatching; return `{ auth }` to dispatch. Optional `context` strings are
 * added as `role: "user"` messages before the dispatched turn.
 */
export type GitHubInboundResult = {
    readonly auth: SessionAuthContext | null;
    readonly context?: readonly string[];
    /** Prior conversation added as user and assistant turns before this message. */
    readonly history?: readonly SessionHistoryMessage[];
    /** Overrides the workflow run title without changing the message sent to the model. */
    readonly title?: string;
} | null;
/**
 * Return type of GitHub inbound hooks: a {@link GitHubInboundResult} or a
 * promise for one.
 */
type GitHubEventHandler<T extends SessionEvent["type"]> = (event: ChannelEventOf<T>, ctx: ChannelEventContext<GitHubEventContext>) => void | Promise<void>;
/**
 * Event handlers for `githubChannel({ events })`. The channel installs built-in
 * handlers for `turn.started` (eyes reaction plus repo checkout),
 * `content.completed` (posts the reply), `interaction.opened` and `interaction.settled`
 * (post each prompt in turn), and `session.ended`/`turn.settled` (posts an error comment). A handler supplied
 * here replaces the built-in for that key rather than running alongside it.
 */
export interface GitHubChannelEvents {
    readonly "call.progress"?: GitHubEventHandler<"call.progress">;
    readonly "call.settled"?: GitHubEventHandler<"call.settled">;
    readonly "call.requested"?: GitHubEventHandler<"call.requested">;
    readonly "interaction.opened"?: GitHubEventHandler<"interaction.opened">;
    readonly "interaction.settled"?: GitHubEventHandler<"interaction.settled">;
    readonly "response.admitted"?: GitHubEventHandler<"response.admitted">;
    readonly "content.delta"?: GitHubEventHandler<"content.delta">;
    readonly "content.completed"?: GitHubEventHandler<"content.completed">;
    readonly "session.ended"?: GitHubEventHandler<"session.ended">;
    readonly "delivery.settled"?: GitHubEventHandler<"delivery.settled">;
    readonly "turn.settled"?: GitHubEventHandler<"turn.settled">;
    readonly "turn.started"?: GitHubEventHandler<"turn.started">;
}
/** Configuration for {@link githubChannel}. */
export interface GitHubChannelConfig {
    readonly api?: GitHubApiOptions;
    /**
     * The name the channel answers to in `@mentions`, supplied directly or
     * resolved lazily on first use inside request handling. Falls back to the
     * credentials' `appSlug`, then `GITHUB_APP_SLUG`.
     */
    readonly botName?: GitHubBotName;
    readonly credentials?: GitHubChannelCredentials;
    readonly events?: GitHubChannelEvents;
    readonly progress?: GitHubProgressConfig;
    readonly pullRequestContext?: GitHubPullRequestContextConfig;
    readonly route?: string;
    /** Policy for accepted messages that arrive while a turn is active. */
    readonly turnPolicy?: TurnPolicy;
    /**
     * Invoked for every `@mention` of the bot in an issue/PR timeline comment or
     * an inline review comment; `ctx.conversation.kind` distinguishes the surface.
     * Return `{ auth }` to dispatch or `null` to ignore. Replaces the default
     * mention gate.
     */
    onComment?(ctx: GitHubInboundContext, comment: GitHubComment): GitHubInboundResult | Promise<GitHubInboundResult>;
    /**
     * Opt-in handler for `check_suite` webhook events. There is no default
     * dispatch. A dispatched turn is anchored to the first associated pull
     * request.
     */
    onCheckSuite?(ctx: GitHubInboundContext, checkSuite: GitHubCheckSuiteEvent): GitHubInboundResult | Promise<GitHubInboundResult>;
    /**
     * Opt-in handler for `check_run` webhook events. There is no default
     * dispatch. A dispatched turn is anchored to the first associated pull
     * request.
     */
    onCheckRun?(ctx: GitHubInboundContext, checkRun: GitHubCheckRunEvent): GitHubInboundResult | Promise<GitHubInboundResult>;
    /**
     * Opt-in handler for `issues` webhook events. There is no default dispatch;
     * define this to act on issues (e.g. `issue.action === "opened"`).
     */
    onIssue?(ctx: GitHubInboundContext, issue: GitHubIssueEvent): GitHubInboundResult | Promise<GitHubInboundResult>;
    /**
     * Opt-in handler for `pull_request` webhook events. There is no default
     * dispatch; define this to act on PRs (e.g. `pullRequest.action === "opened"`).
     */
    onPullRequest?(ctx: GitHubInboundContext, pullRequest: GitHubPullRequestEvent): GitHubInboundResult | Promise<GitHubInboundResult>;
    /**
     * Opt-in handler for `workflow_run` webhook events. There is no default
     * dispatch. A dispatched turn is anchored to the first associated pull
     * request.
     */
    onWorkflowRun?(ctx: GitHubInboundContext, workflowRun: GitHubWorkflowRunEvent): GitHubInboundResult | Promise<GitHubInboundResult>;
}
/** Concrete return type of {@link githubChannel}. */
export interface GitHubChannel extends Channel<GitHubChannelState, GitHubReceiveTarget> {
}
/** GitHub channel factory for GitHub App webhooks and proactive comments. */
export declare function githubChannel(config?: GitHubChannelConfig): GitHubChannel;
export {};
