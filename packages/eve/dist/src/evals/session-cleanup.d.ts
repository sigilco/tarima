interface CleanupSession {
    readonly id: string | undefined;
    cleanup(signal: AbortSignal): Promise<void>;
}
/** Settles each distinct eval-owned root once. */
export declare function cleanupEvalSessions(sessions: readonly CleanupSession[], signal: AbortSignal): Promise<readonly PromiseSettledResult<void>[]>;
export {};
