import type { IncomingHttpHeaders } from "node:http";
export declare const DEVELOPMENT_CLIENT_ADDRESS_HEADER = "x-eve-dev-client-address";
export declare const DEVELOPMENT_CLIENT_ADDRESS_SIGNATURE_HEADER = "x-eve-dev-client-address-signature";
/**
 * Stamps the accepted socket's peer address onto a request bound for the
 * dev worker. Public copies of the metadata headers are dropped first, and
 * the value is signed with the per-process dev transport secret: the
 * worker's own HTTP port is reachable by other local processes, so an
 * unsigned header could be forged by anything that discovers it.
 */
export declare function stampDevelopmentClientAddress(headers: Headers | IncomingHttpHeaders, address: string | undefined, secret: string | undefined): void;
/**
 * Returns the parent-stamped client address when its signature verifies,
 * `undefined` otherwise. Callers fall back to the socket peer, which in the
 * proxied dev topology is the parent's loopback hop.
 */
export declare function readTrustedDevelopmentClientAddress(headers: Headers, secret: string | undefined): string | undefined;
/**
 * Where the dev listener saw a request come from: `"local"` for this machine,
 * `"remote"` for another one, or `undefined` when the request carries no
 * verified stamp, as outside `eve dev`.
 */
export declare function readTrustedDevelopmentPeer(headers: Headers): "local" | "remote" | undefined;
/**
 * Whether a socket peer address or URL host name belongs to this machine. With `--host` bound
 * to a LAN address, the developer's own clients connect from that address
 * rather than loopback.
 */
export declare function isLocalMachineAddress(address: string): boolean;
/** Verifies parent-stamped client provenance carried beyond the original request. */
export declare function isTrustedDevelopmentClientAddress(address: string, signature: string, secret: string | undefined): boolean;
/**
 * Constant-time string comparison over fixed-length digests, so neither the
 * length nor the content of a secret comparison leaks through timing.
 */
export declare function timingSafeEqualStrings(a: string, b: string): boolean;
