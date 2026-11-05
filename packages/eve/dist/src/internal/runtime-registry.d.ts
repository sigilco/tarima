/**
 * Source location for one entry registered with a {@link RuntimeRegistry}.
 *
 * Carried on {@link RuntimeRegistryError} so callers (CLI diagnostics,
 * IDE integrations) can point at the file that introduced the conflict.
 */
export interface RuntimeRegistryEntryLocation {
    readonly logicalPath?: string;
    readonly sourceId?: string;
}
/**
 * Error raised when a runtime-owned subsystem rejects an entry — for
 * example a tool name reserved by the framework or a subagent whose node id
 * is already taken.
 *
 * The `registry` field identifies which subsystem produced the error
 * (`"sandbox"`, `"tool"`, `"subagent"`, …) so consumers can branch on
 * one error class instead of `instanceof`-ing one per primitive.
 */
export declare class RuntimeRegistryError extends Error {
    readonly registry: string;
    readonly entryName?: string;
    readonly logicalPath?: string;
    readonly sourceId?: string;
    constructor(registry: string, message: string, context?: RuntimeRegistryEntryLocation & {
        readonly entryName?: string;
    });
}
/**
 * Options accepted by {@link RuntimeRegistry.register}.
 */
interface RuntimeRegistryRegisterOptions {
    /** Source location attached to the error if registration fails. */
    readonly location?: RuntimeRegistryEntryLocation;
    /** Override the default "duplicate name" error message. */
    readonly duplicateMessage?: string;
    /** Override the default "name reserved" error message. */
    readonly reservedMessage?: string;
}
/**
 * Map-backed primitive for runtime-owned subsystems that index entries
 * by unique name and need to surface a consistent error shape on
 * collision.
 *
 * The optional `reserved` set lets a registry detect collisions across
 * multiple registration passes — for example when runtime-derived tools and
 * selected compiled tools share one model-visible namespace.
 * Once an entry is registered its name is automatically added to the
 * reserved set.
 */
export declare class RuntimeRegistry<TEntry> {
    private readonly registry;
    private readonly _entries;
    private readonly _reserved;
    constructor(registry: string, reserved?: Iterable<string>);
    get size(): number;
    has(name: string): boolean;
    get(name: string): TEntry | null;
    /**
     * Returns the underlying map. Callers must treat the returned value
     * as read-only.
     */
    asMap(): ReadonlyMap<string, TEntry>;
    /**
     * Adds an entry to the registry. Throws {@link RuntimeRegistryError}
     * if `name` is already registered or already reserved by a previous
     * registration pass.
     */
    register(name: string, entry: TEntry, options?: RuntimeRegistryRegisterOptions): void;
    /**
     * Adds or replaces an entry without uniqueness or reservation checks.
     * Use for entries the caller has already validated.
     */
    set(name: string, entry: TEntry): void;
}
export {};
