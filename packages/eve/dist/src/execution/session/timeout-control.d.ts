/**
 * Workflow-body handle for one owner's idle timeout. Activity moves the
 * deadline only in memory; when the durable timer fires before the session
 * has been idle for the whole window, the owner re-arms it for the new
 * deadline. An active session therefore costs one timer per window, not one
 * per turn.
 */
export interface SessionTimeoutControl {
    /** Current idle deadline, including activity since the durable timer was armed. */
    getDeadline(): Date;
    dispose(): Promise<void>;
    /**
     * Answers this owner's elapsed timer: `expired` once the session has been
     * idle for the whole window, otherwise `extended` after arming a timer for
     * the deadline that the latest activity set.
     */
    handleTimerElapsed(): Promise<"expired" | "extended">;
    /** Restarts the idle window from now. */
    recordActivity(): void;
    start(): Promise<void>;
}
/** Creates the idle timeout for one owner run, or `undefined` when timeouts are disabled. */
export declare function createSessionTimeoutControl(input: {
    /** Preserve the idle window when proactively moving an existing session. */
    readonly deadline?: Date;
    readonly sessionId: string;
    readonly timeoutMs: number | false;
}): SessionTimeoutControl | undefined;
