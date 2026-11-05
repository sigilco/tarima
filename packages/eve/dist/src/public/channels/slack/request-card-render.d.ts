/**
 * Renders one approval, question, or budget prompt through the renderers' `interactionCard`
 * chain, and checks the result against eve's own controls so a renderer can restyle a card but
 * never break how its clicks route.
 */
import type { Interaction } from "#channel/interaction-prompts.js";
import { type SlackHitlRoute } from "#public/channels/slack/hitl.js";
import type { SlackCardMessage, SlackInteractionCard, SlackInteractionCardChain, SlackInteractionCardParts } from "#public/channels/slack/renderers.js";
/** One request's messages, and eve's default for it, sent when Slack rejects the rendered ones. */
export interface RenderedRequestCard {
    readonly parts: SlackInteractionCardParts;
    readonly fallback: SlackInteractionCardParts;
}
/**
 * eve's default card: an open, unanswered request's controls, or once answered or settled, one
 * block naming the answer and, when known, who gave it.
 */
export declare function defaultInteractionCard(card: SlackInteractionCard, route?: SlackHitlRoute): SlackInteractionCardParts;
/**
 * How an answered or settled request reads: the answer's label, or how it ended without one,
 * and the notification text. The card and a direct-message request's thread note share it.
 */
export declare function endingOf(interaction: Interaction): {
    readonly label: string;
    readonly text: string;
};
/**
 * Runs `chain` for one request, falling back to eve's default when the renderer throws or its
 * result fails {@link invalidCardReason}. The default renders from the original interaction, so
 * a changed card handed to `next` can't change which controls are expected.
 */
export declare function renderRequestCard(chain: SlackInteractionCardChain, card: SlackInteractionCard, route?: SlackHitlRoute): RenderedRequestCard;
/**
 * eve's default at its smallest: only the block holding its controls, which every open default
 * has exactly one of, or the single block of an answered or settled default.
 */
export declare function compactDefault(fallback: SlackCardMessage): SlackCardMessage;
/**
 * Sends `message`, and once more with eve's default when Slack refuses its content, unless the
 * default is the same message. Any other failure is thrown, since resending after a timeout could
 * duplicate a message that landed. A request without a default for this message, such as details
 * a renderer added, sends nothing the second time.
 */
export declare function sendWithFallback<T>(send: (message: SlackCardMessage) => Promise<T>, message: SlackCardMessage, fallback: SlackCardMessage | undefined): Promise<T | undefined>;
export declare function sameJson(a: unknown, b: unknown): boolean;
