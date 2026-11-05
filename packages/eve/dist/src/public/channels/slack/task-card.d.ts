import { type TaskCard } from "#channel/task-card.js";
import type { SlackCardMessage } from "#public/channels/slack/renderers.js";
import type { SlackChannelInternalEvents } from "#public/channels/slack/slackChannel.js";
/**
 * eve's default task card: a `task_card` block for one task, or a `plan` block
 * for several, and no card for a turn that started none. A settled task shows
 * one line about how it ended and how long it took. A task the model cancelled
 * with `eve__task_cancel` shows as done, since it no longer needed the work; a
 * failed task, or one stopped any other way, shows as an error.
 */
export declare function renderDefaultSlackTaskCard(snapshot: TaskCard): SlackCardMessage | null;
/** The card message eve last wrote for a turn: the card that begins at `since`. */
export interface SlackTaskCardState {
    readonly ts?: string;
    readonly fingerprint?: string;
    /** Where the card it shows begins; absent for the turn's first. */
    readonly since?: number;
}
/**
 * Keeps each turn's task cards current from the session's tables, once per commit. It runs after
 * the renderer chain's own `committed`, so the card never depends on which handlers a renderer
 * keeps, and writes each card `taskCard` returns if it changed.
 */
export declare function withTaskCards(events: SlackChannelInternalEvents, taskCard: (card: TaskCard) => SlackCardMessage | null): SlackChannelInternalEvents;
