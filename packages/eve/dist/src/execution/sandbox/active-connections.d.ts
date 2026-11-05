/** A live connection the server stops, then closes, when it shuts down. */
interface ActiveSandboxConnection {
    stop(): Promise<void>;
}
interface ActiveSandboxConnectionKey {
    readonly providerName: string;
    readonly sessionId: string;
}
/** Registers a live connection. A later one for the same provider and session replaces it. */
export declare function trackActiveSandboxConnection(input: ActiveSandboxConnectionKey & {
    readonly connection: ActiveSandboxConnection;
}): void;
/**
 * Drops `connection` from shutdown tracking, unless a newer one replaced it,
 * or whatever the session has tracked when `connection` is omitted.
 */
export declare function untrackActiveSandboxConnection(input: ActiveSandboxConnectionKey & {
    readonly connection?: ActiveSandboxConnection;
}): void;
/**
 * Stops every tracked connection in parallel, then clears the registry.
 * Failures are logged and never thrown so one misbehaving sandbox cannot
 * block server shutdown.
 */
export declare function shutdownActiveSandboxConnections(input?: {
    readonly log?: (message: string) => void;
}): Promise<void>;
export {};
