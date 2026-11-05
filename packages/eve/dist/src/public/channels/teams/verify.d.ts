/**
 * Microsoft Teams inbound Bot Framework request verification.
 *
 * Teams sends bot activities through the Bot Connector service. eve verifies
 * the bearer JWT against Bot Connector OpenID keys and the bot's Microsoft
 * app id before dispatching any activity to the runtime.
 */
import type { JWTPayload } from "#compiled/jose/index.js";
import { type TeamsAppId, type TeamsFetch } from "#public/channels/teams/api.js";
/**
 * Caller-supplied inbound webhook verifier. Replaces Bot Connector JWT
 * verification when a trusted integration authenticates forwarded requests
 * before they reach eve.
 *
 * Return a falsy value to reject the request (verification throws), a string
 * to accept and use that string as the verified body, or any other truthy
 * value to accept and keep the original request body.
 */
export type TeamsWebhookVerifier = (request: Request, body: string) => unknown | Promise<unknown>;
/** Options for {@link verifyTeamsRequest}. */
export interface TeamsVerifyOptions {
    readonly appId?: TeamsAppId;
    readonly fetch?: TeamsFetch;
    readonly jwksUrl?: string;
    /** Max allowed clock skew, in seconds. Defaults to 5 minutes. */
    readonly maxSkewSeconds?: number;
    readonly openIdMetadataUrl?: string;
    readonly webhookVerifier?: TeamsWebhookVerifier;
}
/** Options for {@link verifyTeamsJwt}. */
export interface TeamsJwtVerifyOptions {
    readonly appId?: TeamsAppId;
    readonly fetch?: TeamsFetch;
    readonly jwksUrl?: string;
    /** Max allowed clock skew, in seconds. Defaults to 5 minutes. */
    readonly maxSkewSeconds?: number;
    readonly openIdMetadataUrl?: string;
}
export interface VerifiedTeamsRequest {
    readonly body: string;
    /** Native Connector claim; a trusted custom verifier owns its own binding. */
    readonly serviceUrl?: string;
}
/**
 * Verifies an inbound Teams request and returns its body and native service URL binding.
 *
 * Uses `webhookVerifier` when provided, otherwise validates the bearer JWT
 * against Bot Connector keys and the resolved app id. Throws when the
 * verifier rejects the request, the bearer token or native service URL claim
 * is missing, no app id can be resolved, keys cannot be loaded, or JWT verification fails.
 */
export declare function verifyTeamsRequest(request: Request, options: TeamsVerifyOptions): Promise<VerifiedTeamsRequest>;
/** Verifies one Bot Connector JWT and returns its payload. */
export declare function verifyTeamsJwt(token: string, options: TeamsJwtVerifyOptions): Promise<JWTPayload>;
