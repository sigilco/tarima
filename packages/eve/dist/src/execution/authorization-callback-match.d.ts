import type { DeliverPayload } from "#channel/types.js";
import type { AuthorizationChallenge, AuthorizationResult } from "#harness/authorization.js";
export interface MatchedAuthorizationCallback {
    readonly challenge: AuthorizationChallenge;
    readonly result: {
        readonly name: string;
        readonly attemptId: string;
    } & AuthorizationResult;
}
/** Matches each callback to exactly one pending authorization attempt. */
export declare function matchAuthorizationCallbacks(signIns: readonly AuthorizationChallenge[], payloads: readonly DeliverPayload[]): {
    readonly matches: readonly MatchedAuthorizationCallback[];
    readonly remainingPayloads: readonly DeliverPayload[];
};
