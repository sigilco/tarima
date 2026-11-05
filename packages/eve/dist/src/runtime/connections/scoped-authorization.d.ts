/**
 * Scope-parameterized authorization flow shared by MCP connections and
 * authored tools and workflow steps using inline providers.
 *
 * A *scope* names the framework-owned callback URL — a connection name for
 * an MCP connection, a tool name for tool-hosted auth. Connection-hosted
 * authorization also carries an opaque instance ID that keys its token cache
 * and pins callback completion to the exact resolved connection. Everything else
 * (principal resolution, the park/resume webhook dance, the loop guard)
 * is identical across both, so it lives here once instead of being
 * duplicated per caller.
 */
import { type ConnectionAuthorizationChallenge } from "#connections/errors.js";
import { type AuthorizationSignal } from "#harness/authorization.js";
import { type SessionAuthContext } from "#context/keys.js";
import { type AuthorizationDefinition, type ConnectionAuthorizationContext, type TokenResult } from "#shared/connection-types.js";
/**
 * Everything the scoped authorization helpers need to drive one
 * authorization strategy: the cache/callback {@link scope}, the
 * authored {@link AuthorizationDefinition}, and the per-scope
 * {@link ConnectionAuthorizationContext} handed to every callback.
 */
export interface ScopedAuthorization {
    readonly boundResponder?: SessionAuthContext;
    /** Opaque resolved instance identity for connection-hosted authorization. */
    readonly instanceId?: string;
    readonly scope: string;
    readonly authorization: Readonly<AuthorizationDefinition>;
    readonly connection: ConnectionAuthorizationContext;
}
/** One execution's token capability and authorization interruption boundary. */
export declare function createAuthorizationExecution(options?: {
    readonly completeAuthorization?: typeof completeScopedAuthorization;
}): {
    complete: (scoped: ScopedAuthorization) => Promise<void>;
    /** Whether this execution completed a sign-in for `scoped`. */
    isJustAuthorized(scoped: ScopedAuthorization): boolean;
    getToken(scoped: ScopedAuthorization): Promise<TokenResult>;
    /**
     * Resolves a stored token for the bound responder, who isn't part of this
     * execution: it never starts or completes a sign-in, so a missing token
     * fails terminally instead of reaching the interruption boundary.
     */
    getResponderToken(scoped: ScopedAuthorization): Promise<TokenResult>;
    requireAuth: (scoped: ScopedAuthorization, cause?: unknown) => never;
    handleError(error: unknown, scoped?: ScopedAuthorization): Promise<AuthorizationSignal>;
    run: typeof executeWithAuthorization;
};
declare class ScopedAuthorizationRequiredError extends Error {
    readonly scoped: ScopedAuthorization;
    readonly justAuthorized: boolean;
    constructor(scoped: ScopedAuthorization, justAuthorized: boolean, cause?: unknown);
}
/** Whether `error` asks the enclosing boundary to start a sign-in. */
export declare function isScopedAuthorizationRequiredError(error: unknown): error is ScopedAuthorizationRequiredError;
/** Produces the shared challenge; the caller owns parking and resumption. */
export declare function handleAuthorizationError(error: unknown, options?: {
    readonly evictToken: boolean;
}): Promise<AuthorizationSignal>;
declare function executeWithAuthorization(execute: () => unknown): Promise<unknown> | AsyncIterable<unknown>;
/**
 * Resolves a bearer token for one scope, consulting the per-step token
 * cache before invoking the authored `getToken`.
 *
 * The cache is keyed by `(instanceId ?? scope, principalKey(principal))` so
 * concurrent users and resolved connection instances never alias onto each
 * other's bearer. Outside a runtime scope the cache is unavailable, but
 * `getToken` still runs with
 * a framework-resolved principal so ad-hoc `"app"`-scoped use keeps
 * working; `"user"`-scoped strategies without a context fail fast inside
 * {@link resolveConnectionPrincipal}.
 *
 * `getToken` may throw {@link ConnectionAuthorizationRequiredError};
 * callers catch it and drive {@link startScopedAuthorization}.
 */
export declare function resolveScopedToken(input: ScopedAuthorization): Promise<TokenResult>;
/**
 * Best-effort removal of a rejected bearer for one scope's resolved
 * principal, across every cache layer.
 *
 * Called when an already-resolved bearer is rejected (a downstream
 * `401`, or an explicit `requireAuth()` after a failed call) so the
 * re-authorization attempt does not re-read the stale token. Drops two
 * layers: eve's per-step cache, and — via the strategy's optional
 * {@link AuthorizationDefinition.evict} hook — any cache the strategy
 * itself owns (e.g. the `@vercel/connect` in-process token cache). The
 * single shared eviction path here means both authored tools and MCP
 * connections cascade identically.
 *
 * No-op outside a runtime scope or when the principal cannot be
 * resolved; a resolution failure here must never mask the underlying
 * authorization error that triggered the eviction.
 */
export declare function evictScopedToken(input: ScopedAuthorization): Promise<void>;
/**
 * Completes an authorization whose callback arrived this turn, caching
 * the freshly minted token under the scope.
 *
 * Returns `true` when a token was minted. Callers use the boolean as a
 * loop guard: a scope authorized this turn that still reports `Required`
 * on the immediately following call has a token the server itself
 * rejected, so it must fail terminally rather than re-challenge forever.
 *
 * No-op (returns `false`) when the strategy is not interactive or no
 * callback arrived for the scope.
 */
export declare function completeScopedAuthorization(input: ScopedAuthorization): Promise<boolean>;
/** Normalizes callback URLs for providers with localhost requirements. */
export declare function resolveAuthorizationCallbackUrl(input: {
    readonly authorization: Readonly<AuthorizationDefinition>;
    readonly callbackUrl: string;
}): string;
/**
 * Resolves the user-facing `displayName` onto a challenge before it is
 * surfaced on sign-in `interaction.opened`.
 *
 * The agent author's static definition-level value wins over the
 * strategy-stamped one: an author writing
 * `auth: { ...connect("x"), displayName: "Y" }` is the most explicit
 * intent, while strategies provide defaults. Returns the input challenge
 * unchanged when the resolved value does not differ.
 */
export declare function stampChallengeDisplayName(challenge: ConnectionAuthorizationChallenge, authorization: Readonly<AuthorizationDefinition>): ConnectionAuthorizationChallenge;
export {};
