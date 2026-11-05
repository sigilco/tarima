import { ContextKey } from "#context/key.js";
import { type SessionAuthContext } from "#context/keys.js";
import type { ConnectionAuthorizationChallenge } from "#connections/errors.js";
import type { AuthorizationCallback, ConnectionPrincipal } from "#shared/connection-types.js";
import type { JsonValue } from "#shared/json.js";
declare const AUTHORIZATION_PENDING_BRAND: "__eveAuthorizationPending";
/**
 * Marks a signal the runtime minted. A symbol key can't come from JSON, so a tool result that
 * carries data shaped like a signal (an MCP or OpenAPI response, a file, a fetched page) stays data
 * instead of parking the turn and naming who it resumes as. Registered, because the runtime can
 * load this module more than once in one process.
 */
declare const AUTHORIZATION_SIGNAL: unique symbol;
export interface AuthorizationChallenge {
    /** Opaque identity of this exact authorization attempt. */
    readonly attemptId?: string;
    readonly candidateId?: string;
    /**
     * Credential this sign-in grants, shared by every scope that uses it (the
     * Vercel Connect connector). Attempts for the same grant and principal are
     * one sign-in, so only one is shown.
     */
    readonly grant?: string;
    /** Opaque resolved connection identity; omitted for tool-hosted authorization. */
    readonly instanceId?: string;
    readonly name: string;
    readonly challenge: ConnectionAuthorizationChallenge;
    readonly hookUrl: string;
    /** Principal passed to `startAuthorization`; omitted from model-facing copies. */
    readonly principal?: ConnectionPrincipal;
    /** Session principal that started this attempt; projected onto authorization events. */
    readonly principalId?: string;
    /**
     * Session identity that started this attempt. The callback carries no
     * identity, so the resumed turn runs as this caller. Never projected onto
     * events or model-facing output.
     */
    readonly requester?: SessionAuthContext;
    /**
     * Opaque resume value from the strategy's `startAuthorization`,
     * journaled across the park. Absent for provider-owned flows.
     */
    readonly resume?: JsonValue;
}
export interface AuthorizationSignal {
    readonly [AUTHORIZATION_SIGNAL]: true;
    readonly challenges: readonly AuthorizationChallenge[];
}
/**
 * Opaque tool output the model sees while authorization is pending.
 * Contains connection names only — no OAuth URLs, user codes, or hook URLs.
 */
export interface AuthorizationPendingModelOutput {
    readonly [AUTHORIZATION_PENDING_BRAND]: true;
    readonly connections: readonly string[];
}
export interface AuthorizationResult {
    readonly attemptId?: string;
    readonly instanceId?: string;
    readonly resume?: JsonValue;
    readonly callback: AuthorizationCallback;
    readonly hookUrl: string;
    readonly principal?: ConnectionPrincipal;
}
/**
 * Creates an authorization signal. Return this from a tool's execute
 * to suspend the session for OAuth or other external authorization.
 *
 * The harness emits sign-in `interaction.opened` events for each challenge
 * and parks the session. Channels render sign-in buttons.
 */
export declare function requestAuthorization(challenges: readonly AuthorizationChallenge[]): AuthorizationSignal;
/**
 * Reads the authorization callback on resume. Returns `undefined` if
 * not resuming from an authorization request.
 *
 * When `name` is omitted, returns the first result (convenience for
 * single-challenge tools).
 */
export declare function getAuthorizationResult(name?: string): AuthorizationResult | undefined;
/** Returns every callback result available to the active step. */
export declare function getAuthorizationResults(): readonly NamedAuthorizationResult[];
/**
 * Removes and returns one authorization callback result.
 *
 * Callback results are one-shot inputs to `completeAuthorization`. Consuming
 * before completion prevents a failed or replayed callback from poisoning
 * every later tool call in the same step.
 */
export declare function consumeAuthorizationResult(name: string, instanceId?: string): AuthorizationResult | undefined;
/**
 * Builds a callback URL for external systems. `name` and `attemptId` identify
 * the exact challenge in the URL path.
 *
 * By default the URL embeds the session's stable inbox token.
 * A runtime with its own continuation supplies that hook through AuthorizationHookKey.
 * It is independent of the continuation token, so channel aliasing mid-turn
 * does not invalidate the callback URL.
 *
 * The URL reaches the user's browser and the IdP, so it never carries the
 * deployment's protection bypass secret.
 *
 * Returns `undefined` if no callback address is available.
 */
export declare function getHookUrl(name: string, attemptId: string): string | undefined;
/** Mints the identity and callback URL for one interactive authorization attempt. */
export declare function createAuthorizationAttempt(name: string): {
    readonly attemptId: string;
    readonly hookUrl: string;
} | undefined;
export declare function isAuthorizationSignal(value: unknown): value is AuthorizationSignal;
export declare function isAuthorizationPendingModelOutput(value: unknown): value is AuthorizationPendingModelOutput;
/**
 * JSON-safe pending authorization output for model-facing tool results and
 * wire surfaces (`call.settled`, telemetry). Omits OAuth URLs and user
 * codes — connection names only.
 */
export declare function authorizationPendingAsJsonObject(input: {
    readonly connections: readonly string[];
}): AuthorizationPendingModelOutput;
/**
 * Projects a full {@link AuthorizationSignal} to the opaque shape recorded
 * in model-facing tool results and session history.
 */
export declare function modelFacingAuthorizationOutput(signal: AuthorizationSignal): AuthorizationPendingModelOutput;
/** Human-readable tool output for {@link modelFacingAuthorizationOutput}. */
export declare function authorizationPendingModelText(connections: readonly string[]): string;
/**
 * Physical hook token embedded in a session's authorization callback URLs.
 * The callback route resumes exactly this hook, so it is the stable inbox's
 * physical address rather than its logical session token.
 */
export declare function authHookToken(sessionId: string): string;
interface NamedAuthorizationResult extends AuthorizationResult {
    readonly name: string;
}
export declare const PendingAuthorizationResultKey: ContextKey<readonly NamedAuthorizationResult[]>;
/**
 * Deployment base URL for building callback URLs. Set by the
 * framework (turnStep) at the start of each step from workflow
 * metadata.
 */
export declare const CallbackBaseUrlKey: ContextKey<string>;
/** Hook token of a runtime that owns its callback instead of using the session hook. */
export declare const AuthorizationHookKey: ContextKey<string>;
export {};
