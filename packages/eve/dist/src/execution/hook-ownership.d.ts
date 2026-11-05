import type { Hook } from "#compiled/@workflow/core/index.js";
export declare function claimHookOwnership<T>(hook: Hook<T>): Promise<void>;
export declare function disposeHook(hook: {
    dispose: () => unknown;
}): Promise<void>;
/** Error names survive Workflow serialization across runtime boundaries. */
export declare function isHookConflictError(error: unknown): error is {
    readonly conflictingRunId?: unknown;
    readonly name: "HookConflictError";
    readonly token?: unknown;
};
/**
 * Another run took the hook's token with `experimental_force`. Matched by name:
 * `HookForceClaimedError.is` lives in a module the workflow bundle cannot load.
 */
export declare function isHookForceClaimedError(error: unknown): error is {
    readonly claimedByRunId: string;
    readonly name: "HookForceClaimedError";
};
