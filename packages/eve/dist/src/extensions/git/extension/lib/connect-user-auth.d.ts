import { deleteTokenCacheEntry, getTokenResponse, startAuthorization } from "@vercel/connect";
import { type InteractiveAuthorizationDefinition } from "eve/connections";
/** The Connect calls the sign-in uses; injectable for tests. */
export interface ConnectUserClient {
    readonly getTokenResponse: typeof getTokenResponse;
    readonly startAuthorization: typeof startAuthorization;
    readonly deleteTokenCacheEntry: typeof deleteTokenCacheEntry;
}
/**
 * Connect-backed sign-in for user-scoped `gh` tokens. It mirrors
 * `connect({ connector, principalType: "user" })` from `@vercel/connect/eve`,
 * which eve cannot bundle because it imports `eve` itself. Requests carry no
 * authorization details, so one grant serves every repository.
 */
export declare function connectUserAuthorization(connector: string, client?: ConnectUserClient): InteractiveAuthorizationDefinition;
