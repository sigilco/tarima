/**
 * The session affinity report AI Gateway returns in `providerMetadata.gateway.routing`.
 *
 * Gateway documents that new `affinity.outcome` values may appear, so every
 * field stays an open string.
 */
export interface GatewayRouting {
    readonly clientSessionId?: string;
    readonly clientSessionIdSource?: string;
    readonly affinity?: {
        readonly displacedProvider?: string;
        readonly outcome?: string;
        readonly pinnedProvider?: string;
    };
}
/**
 * Reads the session affinity fields from an unknown-shaped
 * `providerMetadata.gateway.routing` value and drops every other key.
 */
export declare function readGatewayRouting(value: unknown): GatewayRouting | undefined;
