import type { SessionAuthContext } from "#channel/types.js";
import type { SlackMessage } from "#public/channels/slack/inbound.js";
import type { SlackInteractionCardChain } from "#public/channels/slack/renderers.js";
import { type SignIn } from "#channel/sign-in.js";
import type { SlackApprovalChannelResolver, SlackChannelConfig, SlackChannelInternalEvents, SlackContext, SlackEventContext, SlackMentionResult } from "#public/channels/slack/slackChannel.js";
/**
 * Workspace-scoped projection of the Slack actor that produced
 * `message`, derived into a {@link SessionAuthContext}. Used by both
 * {@link defaultOnMessage} when
 * the customer hasn't supplied their own `onAppMention` /
 * `onDirectMessage`. Returns `null` when the message has no author.
 */
export declare function defaultSlackAuth(message: SlackMessage, ctx: SlackContext): SessionAuthContext | null;
/**
 * Default `onAppMention` and `onDirectMessage`: dispatches with auth derived
 * from the Slack actor. Acknowledging the message is the renderer chain's
 * `received`, so replacing a message hook never drops it.
 */
export declare function defaultOnMessage(ctx: SlackContext, message: SlackMessage): SlackMentionResult;
/**
 * Default `onMessageEdited`: runs the hook a new message of the same kind would reach on the
 * edited message, so the app's own checks decide edits too. Without authored hooks, that sends
 * edits to DMs, code channel messages, and messages that mention the bot before or after the
 * edit, and drops the rest.
 */
export declare function defaultOnMessageEdited(hooks: Pick<SlackChannelConfig, "onAppMention" | "onDirectMessage" | "onMessage">): NonNullable<SlackChannelConfig["onMessageEdited"]>;
/** eve's default `received`: the `Thinking...` status, set the moment a message arrives. */
export declare function defaultReceived(_message: SlackMessage, ctx: SlackContext): Promise<void>;
/**
 * A sign-in: a public, link-free status for the thread, and the challenge, which is a credential,
 * privately to the person who must sign in.
 */
export declare function showSlackSignIn(event: SignIn, channel: SlackEventContext): Promise<void>;
/**
 * eve's default handlers for input requests, rendering cards through the composed
 * `interactionCard` chain. A commit's requests post as one batch on its first
 * `interaction.opened`. Each card shows an open request's answer when it is admitted or refused,
 * and its settled rendering on `interaction.settled`. A sign-in renders as its public status and
 * private challenge instead.
 */
export declare function defaultInteractionEvents(approvalChannel: SlackApprovalChannelResolver | undefined, interactionCard: SlackInteractionCardChain): Pick<SlackChannelInternalEvents, "interaction.opened" | "interaction.settled" | "response.admitted" | "response.settled">;
/**
 * eve's default Slack event rendering: status lines, replies, errors, and the
 * connection-authorization flow. It is the innermost link of every channel's
 * renderer chain. Typed as the internal full-context map because the default
 * sign-in `interaction.opened` handler owns the public link-free status, which
 * authored renderers cannot express.
 */
export declare const defaultEvents: SlackChannelInternalEvents;
