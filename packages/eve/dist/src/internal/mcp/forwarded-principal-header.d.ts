import { type ForwardedPrincipal, type TrustedForwarders } from "#channel/forwarded-principal.js";
import type { SessionAuthContext } from "#channel/types.js";
/** Request header carrying a forwarded principal on MCP requests. */
export declare const FORWARDED_PRINCIPAL_HEADER = "eve-forwarded-principal";
/** Largest accepted encoded header value. */
export declare const FORWARDED_PRINCIPAL_HEADER_MAX_BYTES: number;
/** The principals one MCP request's published tools run as. */
export interface McpRequestPrincipals {
    /** The route-auth principal, or the accepted forwarded `current`. */
    readonly current: SessionAuthContext;
    /** The accepted forwarded initiator, or `current` when none was forwarded. */
    readonly initiator: SessionAuthContext;
    /** The verified route principal that forwarded `current`, when one did. */
    readonly forwarder?: SessionAuthContext;
}
/**
 * Resolves the `eve-forwarded-principal` header against the channel's
 * `trustedForwarders`, sharing parsing, stamping, and the predicate with
 * eveChannel's `forwardedPrincipal` body field.
 *
 * A header the channel cannot accept is a 403 rather than ignored: running the
 * call as the forwarder instead would silently widen it to the forwarder's
 * access. An anonymous route principal cannot forward, since no one is
 * accountable for the assertion. A malformed or oversized header is a 400.
 */
export declare function resolveMcpRequestPrincipals(request: Request, routePrincipal: SessionAuthContext, trustedForwarders: TrustedForwarders | undefined): Promise<McpRequestPrincipals | Response>;
/**
 * Encodes a principal for the header, failing before the request when the
 * receiving channel would refuse it as oversized.
 */
export declare function encodeForwardedPrincipalHeader(principal: ForwardedPrincipal, connectionName: string): string;
