/**
 * Base class of errors eve throws to callers. Every eve error has a stable snake_case `code`.
 *
 * Narrow with the static `is()` of the class you expect, such as `ClientError.is(error)`.
 * Unlike `instanceof`, it recognizes errors created by another copy of eve, for example when a
 * framework bundles eve separately from your application code.
 */
export declare class EveError extends Error {
    /**
     * Stable class name that `is()` matches and the instance `name` reports. Minifiers rename
     * constructors, so every subclass must declare its own; the constructor throws otherwise.
     */
    static readonly errorName: string;
    /** Stable snake_case error code. */
    readonly code: string;
    constructor(code: string, message: string, options?: ErrorOptions);
    /** Whether `error` is an eve error of this class or a subclass, from any copy of eve. */
    static is<T extends EveError>(this: {
        readonly errorName: string;
        readonly prototype: T;
    }, error: unknown): error is T;
}
