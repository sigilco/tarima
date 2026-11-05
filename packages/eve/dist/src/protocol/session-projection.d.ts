import type { SessionEvent } from "#protocol/session-event.js";
import type { Usage } from "#protocol/session-events/envelope.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
export interface SessionProjection {
    /** The public view, kept with operational retention; its `position` is the next line's. */
    readonly view: SessionView;
    /** Runs and context changes minted so far, so their ids are deterministic. */
    readonly counters: {
        readonly runs: number;
        readonly changes: number;
    };
    /** The turn that streamed output, so steering can no longer restart it. */
    readonly outputStarted?: string;
    /** The latest own budget acceptance, anchored at its commit's spend; retained after rows prune. */
    readonly usageWindow?: {
        readonly interactionId: string;
        readonly index: number;
        readonly start: Usage;
    };
}
export declare function initialSessionProjection(): SessionProjection;
/** Folds a line's observations beside its already-folded view. */
export declare function foldSession<S extends SessionProjection>(state: S, events: readonly SessionEvent[]): S;
/** The open turn's id, if one is open. */
export declare function activeTurnIdOf(state: SessionProjection): string | undefined;
/** The session's newest turn, open or closed. */
export declare function latestTurnIdOf(state: SessionProjection): string | undefined;
/** The turn a run serves, if a turn owns it. */
export declare function runTurnId(state: SessionProjection, runId: string): string | undefined;
/** The id the session's next model run takes. */
export declare function nextRunId(state: SessionProjection): string;
/** The id the session's next context change takes. */
export declare function nextChangeId(state: SessionProjection): string;
/** The open run that serves a turn: its latest run not yet settled. */
export declare function openRunOf(state: SessionProjection, turnId: string): string | undefined;
/** The coordinates the active turn's events carry, or the next turn's when none is open. */
export declare function turnCoordinates(state: SessionProjection): {
    readonly sequence: number;
    readonly stepIndex: number;
    readonly turnId: string;
};
/** Where a turn's events go: its sequence and its latest step. */
export declare function turnCoordinatesOf(state: SessionProjection, turnId: string): {
    readonly sequence: number;
    readonly stepIndex: number;
    readonly turnId: string;
};
