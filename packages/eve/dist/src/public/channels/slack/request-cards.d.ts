/**
 * eve's Slack cards for approvals, questions, and budget prompts: a commit's requests post as one
 * batch, and each card updates as its request is answered and settles. Renderers choose the
 * blocks through `interactionCard`; this module owns routing, batching, and the messages.
 */
import { type RefusedAnswer, type RequestBatch } from "#channel/interaction-prompts.js";
import type { ChannelEventContext } from "#public/definitions/channel.js";
import type { SlackInteractionCardChain } from "#public/channels/slack/renderers.js";
import type { SlackApprovalChannelResolver, SlackEventContext } from "#public/channels/slack/slackChannel.js";
type RequestCardContext = ChannelEventContext<SlackEventContext>;
/**
 * Posts a commit's requests: each `approvalChannel` sends to the thread joins one batch, details
 * first, then controls, grouped under Slack's 50-block cap; each sent to a DM posts there alone.
 */
export declare function postRequestCards(batch: RequestBatch, ctx: RequestCardContext, chain: SlackInteractionCardChain, approvalChannel: SlackApprovalChannelResolver | undefined): Promise<void>;
/**
 * Shows an open request's changed answer: an admitted one, or the controls again once it was
 * refused. A request already settled in the commit is left to `interaction.settled`.
 */
export declare function showAnswerChange(interactionId: string, ctx: RequestCardContext, chain: SlackInteractionCardChain): Promise<void>;
/**
 * Writes a settled request's card. Every request of its message that settled in the same commit
 * without its settled rendering written joins the one update, since the commit's view already
 * shows them settled. Then deletes each details message whose requests have all written their
 * settled rendering, reports the outcome in a DM request's thread note, and forgets the message
 * once every request in it has.
 */
export declare function settleRequestCard(interactionId: string, ctx: RequestCardContext, chain: SlackInteractionCardChain): Promise<void>;
/**
 * A responder an approval's policy or check refused hears why privately. A pending answer gets
 * no notice: an ephemeral cannot be removed once the approval settles, and the card itself
 * reports the outcome moments later.
 */
export declare function notifyRefusedResponder(refused: RefusedAnswer, channel: SlackEventContext): Promise<void>;
export {};
