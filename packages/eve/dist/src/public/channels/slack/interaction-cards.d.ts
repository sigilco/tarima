import type { InteractionHandlerDeps, ParsedBlockActionsPayload } from "#public/channels/slack/interactions.js";
/**
 * What a settled card shows in place of its controls: the line that replaces
 * them, the notification text of the update, such as `Answered: Saturday` or
 * `No longer active`, and who answered when the card credits someone.
 */
export interface SettledCard {
    readonly label: string;
    readonly text: string;
    readonly userId?: string;
}
/** Retires an answered `card` in place: same single block, buttons replaced by the answer. */
export declare function answeredBlocksFromActionBlock(input: {
    readonly answerLabel: string;
    readonly block: unknown;
    readonly userId?: string;
}): unknown[] | undefined;
/** Replaces a pressed HITL card's controls with `card`. */
export declare function settleHitlCard(interaction: ParsedBlockActionsPayload, deps: InteractionHandlerDeps, card: SettledCard): Promise<void>;
/** Replaces a freeform card's controls with `card`. */
export declare function settleFreeformCard(input: {
    readonly card: SettledCard;
    readonly channelId: string;
    readonly deps: InteractionHandlerDeps;
    readonly installationTeamId?: string;
    readonly messageTs: string;
}): Promise<void>;
