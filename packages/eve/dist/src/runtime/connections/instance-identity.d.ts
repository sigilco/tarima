import type { ConnectionProtocol } from "#shared/connection-types.js";
/** Builds the opaque, reconstruction-stable identity for one resolved connection instance. */
export declare function createConnectionInstanceId(input: {
    readonly connectionName: string;
    readonly instanceKey?: string;
    readonly protocol: ConnectionProtocol;
    readonly sourceId: string;
    readonly url: string;
}): string;
