import type { RuntimeActionResult } from "#shared/action-types.js";
/** Returns results in pending-call order once every requested call has completed. */
export declare function resolveRuntimeActionResultsForCallIds<TResult extends RuntimeActionResult>(input: {
    readonly pendingCallIds: readonly string[];
    readonly results: readonly TResult[];
}): TResult[] | undefined;
