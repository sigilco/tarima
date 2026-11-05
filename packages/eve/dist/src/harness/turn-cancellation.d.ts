/** Terminal outcome of a cancelled turn. */
export declare class TurnCancelledError extends Error {
    constructor(message?: string);
}
/**
 * A turn cancellation raised when the user declines a session-limit
 * continuation prompt. It keeps the canonical cancellation name, so execution
 * settles it through the standard turn-cancellation path.
 */
export declare class SessionLimitDeclinedError extends TurnCancelledError {
    constructor();
}
/** True when the error, or one of its causes, is a {@link TurnCancelledError}. */
export declare function isTurnCancellation(error: unknown): boolean;
/** Throws when the turn signal has aborted. */
export declare function throwIfTurnAborted(abortSignal: AbortSignal | undefined): void;
