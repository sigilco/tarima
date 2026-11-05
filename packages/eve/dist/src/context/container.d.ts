import { type ContextAccessor, type ContextKey } from "#context/key.js";
import { type LocalDevRequestProvenance } from "#context/keys.js";
/**
 * Keyed value container that backs one eve execution scope.
 *
 * Durable values are serialized across workflow steps and turns. Virtual
 * values are rebuilt each step by context providers and are never
 * serialized.
 *
 * Extends {@link ContextAccessor} with the `entries()` iterator used by
 * the serialization layer.
 */
export interface AlsContext extends ContextAccessor {
    /** Verified originating-client metadata, inherited only for the dev-TUI hint. */
    readonly localDevRequest?: LocalDevRequestProvenance;
    /** Removes a durable or step-local value from the context. */
    delete<T>(key: ContextKey<T>): boolean;
    /**
     * Iterates all durable key/value pairs currently stored in the context.
     * Used by the serialization layer to persist context at step boundaries.
     */
    entries(): Iterable<readonly [ContextKey<unknown>, unknown]>;
    /** Stores a step-local value that shadows the durable value and is never serialized. */
    setVirtualContext<T>(key: ContextKey<T>, value: T): void;
}
/**
 * Default mutable implementation of {@link AlsContext}.
 */
export declare class ContextContainer implements AlsContext {
    private readonly _durableValues;
    private readonly _virtualValues;
    constructor(input?: {
        readonly localDevRequest?: LocalDevRequestProvenance;
    });
    get localDevRequest(): LocalDevRequestProvenance | undefined;
    get<T>(key: ContextKey<T>): T | undefined;
    require<T>(key: ContextKey<T>): T;
    has<T>(key: ContextKey<T>): boolean;
    set<T>(key: ContextKey<T>, valueOrUpdater: T | ((current: T | undefined) => T)): T;
    ensure<T>(key: ContextKey<T>, create: () => T): T;
    delete<T>(key: ContextKey<T>): boolean;
    /**
     * Clears all step-local provider values from the context.
     *
     * The runtime calls this before rebuilding context providers for a new
     * step.
     */
    clearVirtualContext(): void;
    /**
     * Stores a step-local provider value for one key.
     *
     * Virtual values shadow durable values for the lifetime of the current
     * step and are excluded from serialization.
     */
    setVirtualContext<T>(key: ContextKey<T>, value: T): void;
    entries(): Generator<readonly [ContextKey<unknown>, unknown]>;
}
export declare const contextStorage: {
    getStore: () => AlsContext | undefined;
    run: <T>(context: AlsContext, fn: () => T) => T;
};
/** Reads branch-local metadata without changing the identity of the active context. */
export declare function contextScopeValue<T>(key: symbol): T | undefined;
/** Runs one async branch with metadata on the existing context storage, not another ALS. */
export declare function withContextScopeValue<T>(key: symbol, value: unknown, fn: () => T): T;
/**
 * Returns the active context, throwing when called outside a managed scope.
 */
export declare function loadContext(): AlsContext;
