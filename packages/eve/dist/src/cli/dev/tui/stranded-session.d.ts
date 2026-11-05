/**
 * One notice naming the session, the cause, the version pair, and the
 * command that gets the user unstuck; `undefined` for any other error. The
 * server's eve version is known only when the TUI runs its own dev server.
 */
export declare function formatStrandedSessionNotice(error: unknown, input: {
    readonly localServer: boolean;
    readonly sessionId: string | undefined;
}): string | undefined;
