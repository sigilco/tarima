import type { ConnectionProtocol } from "#shared/connection-types.js";
/**
 * Stamps the wire protocol on a connection definition. Called by the
 * `define*` factory that produced it.
 */
export declare function stampConnectionProtocol(definition: object, protocol: ConnectionProtocol): void;
/**
 * Reads the protocol marker stamped by the connection helper.
 * Dynamic connection resolvers use this to distinguish one branded
 * connection definition from a map of branded definitions.
 */
export declare function readStampedConnectionProtocol(definition: unknown): ConnectionProtocol | undefined;
