interface NitroAppLike {
    readonly hooks?: {
        hook(name: "close", handler: () => Promise<void>): unknown;
    };
}
/**
 * Reports whether this server process owns sandbox shutdown.
 *
 * - `eve dev` workers are excluded: the dev CLI parent already stops
 *   dev-tagged sandboxes when the dev server closes.
 * - Vercel serverless instances are excluded: instance recycling is not
 *   a server stop, and persistent session sandboxes must keep serving
 *   later invocations.
 */
export declare function shouldInstallSandboxShutdown(env: Record<string, string | undefined>): boolean;
/**
 * Stops all tracked sandboxes, bounded by
 * {@link SANDBOX_SHUTDOWN_TIMEOUT_MS}. Never throws.
 */
export declare function runSandboxShutdown(log: (message: string) => void): Promise<void>;
/**
 * Stops tracked sandboxes when the server closes. On SIGINT or SIGTERM,
 * srvx's graceful shutdown closes the server and Nitro runs its `close`
 * hooks; the process then exits on its own.
 */
export declare function installSandboxShutdown(input: {
    readonly env: Record<string, string | undefined>;
    readonly log: (message: string) => void;
    readonly nitroApp?: NitroAppLike;
}): void;
export default function sandboxShutdownPlugin(nitroApp?: NitroAppLike): void;
export {};
