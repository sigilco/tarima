/**
 * Workflow-owned abort controls prepared before a turn begins. One that no
 * turn uses is left open, as a finished turn's are: nothing listens to it,
 * so aborting it would only add Workflow writes.
 */
export interface TurnControl {
    readonly cancellation: AbortController;
    readonly steering: AbortController;
}
export declare function createTurnControl(): TurnControl;
