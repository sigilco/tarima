/** Longest ingress waits for a session hook to change hands. */
export declare const SESSION_HOOK_HANDOVER_TIMEOUT_MS = 30000;
/**
 * Waits until no run serving `session` holds any of the logical addresses. A
 * handoff successor serves the same session, so only the session's end (or
 * an unrelated run claiming the address afterwards) satisfies the wait.
 */
export declare function waitForSessionHooksRelease(logicalTokens: Iterable<string>, session: {
    readonly ownerRunId: string;
    readonly sessionId: string;
}): Promise<void>;
