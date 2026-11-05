import type { SessionAuthContext } from "#channel/types.js";
/**
 * Attribute key the receiving deployment stamps onto accepted forwarded
 * principal contexts. Holds the verified transport forwarder's `principalId`,
 * always overwriting any sender-supplied value — a forwarder must not be able
 * to falsify the audit trail. On multi-hop chains the attribute names the
 * most recent hop only.
 */
export declare const FORWARDED_BY_ATTRIBUTE = "eve:forwarded-by";
/**
 * Wire shape of the session-request `forwardedPrincipal` body field: the
 * dispatching turn's session principals, asserted by a trusted forwarder.
 * Only principal metadata crosses the wire — never tokens or credentials.
 */
export interface ForwardedPrincipal {
    readonly current: SessionAuthContext;
    readonly initiator?: SessionAuthContext;
}
/**
 * What a forwarder asks the receiving deployment to adopt, passed to
 * {@link TrustedForwarders} next to the verified forwarder.
 */
export interface ForwardedAssertion {
    /**
     * The session principals the forwarder asserts, present when it forwards a
     * principal and absent when only remote parent lineage is being trusted.
     * Both contexts are already stamped with {@link FORWARDED_BY_ATTRIBUTE}, and
     * `initiator` is `current` when the sender omitted it. `initiator` takes
     * effect only on session creation: continuation requests install only
     * `current`, so there `initiator` is the asserted value, not the session's
     * pinned initiator.
     */
    readonly principal?: {
        readonly current: SessionAuthContext;
        readonly initiator: SessionAuthContext;
    };
}
/**
 * Authorizes a transport-authenticated forwarder to supply eve delegation
 * context. Receives the *verified* route-auth principal (who is asserting) and
 * the principals it asserts, so a receiver can limit each forwarder to the
 * identities it may speak for.
 */
export type TrustedForwarders = (forwarder: SessionAuthContext, assertion: ForwardedAssertion) => boolean | Promise<boolean>;
type ForwardedPrincipalParseResult = {
    readonly forwardedPrincipal: ForwardedPrincipal;
    readonly ok: true;
} | {
    readonly cause: unknown;
    readonly message: string;
    readonly ok: false;
};
/**
 * A session route's effective principals after the forwarded
 * principal gate: the transport principal untouched when the body carries no
 * assertion, or the stamped forwarded contexts once a trusted forwarder's
 * assertion is accepted.
 */
type ResolvedForwardedPrincipal = {
    readonly accepted: false;
    readonly auth: SessionAuthContext;
} | {
    readonly accepted: true;
    readonly auth: SessionAuthContext;
    readonly initiatorAuth: SessionAuthContext;
};
/**
 * Gates the `forwardedPrincipal` body field and resolves the
 * effective session principals. Returns the failure `Response` on rejection:
 * 403 when the channel accepts no forwarded principal or the predicate
 * refuses the forwarder or what it asserts, 400 on a malformed payload, 500
 * when the authored predicate throws. Accepted contexts are stamped with
 * {@link FORWARDED_BY_ATTRIBUTE} before they are returned, so a custom
 * `onMessage` always sees the transport forwarder on the replaced principal.
 */
export declare function resolveForwardedPrincipal(input: {
    readonly trustedForwarders: TrustedForwarders | undefined;
    readonly forwarder: SessionAuthContext;
    readonly payload: Record<string, unknown>;
}): Promise<ResolvedForwardedPrincipal | Response>;
/**
 * Parses the `forwardedPrincipal` body field against the
 * strict wire schema. Mirrors `parseSessionCallback` for `callback`: strict
 * keys, formatted error strings, and no exceptions.
 */
export declare function parseForwardedPrincipal(value: unknown): ForwardedPrincipalParseResult;
/**
 * Returns a copy of `context` with {@link FORWARDED_BY_ATTRIBUTE} set to the
 * verified transport forwarder's `principalId`, overwriting any
 * sender-supplied value. Attributes never affect Connect token-cache keying
 * (`principalKey` reads only issuer + id), so stamping is purely an audit
 * trail.
 */
export declare function stampForwardedBy(context: SessionAuthContext, forwardedBy: string): SessionAuthContext;
export {};
