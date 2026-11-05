import type { SessionView as SessionTables } from "#protocol/session-projection/tables.js";
import { type SessionView } from "#protocol/session-projection/session-view.js";
import { type CallObservation } from "#protocol/session-projection/public-view.js";
import type { ChannelAudience } from "#shared/channel-audience.js";
/**
 * One card of a turn. A turn keeps one card unless it starts a task after every task on its card
 * ended, as a turn its caller keeps talking to does: that card is finished, and the next begins.
 */
export interface TaskCard {
    readonly turnId: string;
    /** Where the card begins on the stream: `0` for a turn's first card. */
    readonly since: number;
    /**
     * `blocked` while any of its tasks waits on an interaction, `working` while one works, or, for the
     * turn's latest card, while the turn does; then `finished`.
     */
    readonly state: "working" | "blocked" | "finished";
    /**
     * The turn's calls the card shows, in call order. A task's call has a `taskId`. A call that
     * isn't a task belongs to the card open when it ended, or to the latest card while it runs.
     */
    readonly calls: readonly CallObservation[];
    /** The immutable observation snapshot used to build the card. */
    readonly view: SessionView;
    /** Who reads the card. A failed task's error and a request's prompt are for `private` only. */
    readonly audience: ChannelAudience;
}
/** A turn's cards, oldest first; every card but the latest is finished. */
export declare function taskCards(view: SessionTables, turnId: string, audience: ChannelAudience): readonly TaskCard[];
/** The names of a turn's working tasks, for a status such as `Waiting on researcher...`. */
export declare function workingTaskNames(view: SessionTables, turnId: string): readonly string[];
