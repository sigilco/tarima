export declare const LOCAL_DEV_INTERACTIVE_CLIENT_HEADER = "x-eve-dev-interactive-client";
/**
 * Host facilities available to authored code running on an `eve dev` server.
 *
 * Absence means this host has no authored tree to mutate or watcher to pause.
 * Presence describes the host, not the caller: code that edits the authored
 * tree on a caller's behalf must authorize that caller separately.
 */
export interface LocalDevCapability {
    /**
     * Absolute path of the authored application root — the directory holding
     * `package.json` and the authored `agent/` tree, never a runtime snapshot.
     */
    readonly appRoot: string;
    /**
     * Whether the originating client is the dev TUI and can run a flow that asks
     * questions in its terminal. This inherited hint is not proof that the
     * current sender has a live terminal.
     */
    readonly interactiveClient: boolean;
    /**
     * Runs `task` with the authored-source watcher paused, then resumes it.
     *
     * Each suspension has an idempotent lease, so concurrent holders cannot
     * resume each other early; the final release rebuilds authored
     * artifacts instead of waiting for the watcher's change debounce.
     */
    withSuspendedSource<T>(task: () => Promise<T>): Promise<T>;
}
/**
 * Publishes the local dev capability to the runtime for one dev server.
 *
 * Returns a restore function that reinstates the previous values, matching the
 * other environment installers the dev host tears down on close.
 */
export declare function installLocalDevCapabilityEnvironment(input: {
    readonly appRoot: string;
    readonly serverUrl: string;
}): () => void;
/**
 * Seeds the inherited dev-TUI hint only when the dev host signed a peer
 * address on this machine. Client-supplied address headers cannot create that hint.
 */
export declare function withLocalDevRequestScope<T>(request: Request, callback: () => Promise<T>): Promise<T>;
/**
 * Resolves local development host facilities, or `undefined` when this host
 * lacks the authored root or watcher control origin installed by `eve dev`.
 * Request provenance affects only the optional dev-TUI hint, never access to
 * the authored tree.
 *
 * This is deliberately not a {@link import("#public/definitions/tool.js").ToolContext}
 * field: both values are meaningless in a deployed runtime, and a capability
 * that cannot exist there should be absent from the type rather than present
 * and undefined.
 */
export declare function getLocalDevCapability(environment?: Readonly<Record<string, string | undefined>>): LocalDevCapability | undefined;
