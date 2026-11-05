import type { Approval } from "#approval/definition.js";
import type { ResolvedConnectionDefinition } from "#runtime/types.js";
import type { ConnectionClient } from "#shared/connection-types.js";
import type { ConnectionRegistry } from "#runtime/connections/registry-types.js";
/**
 * Per-step container mapping connection names to lazily-initialized
 * client wrappers. `withContextScope` builds one per step, and the connection
 * provider disposes it when the step ends.
 *
 * The registry is protocol-agnostic: it dispatches to the client
 * implementation matching each connection's `protocol` (MCP or OpenAPI).
 */
export declare class ConnectionRegistryImpl implements ConnectionRegistry {
    #private;
    constructor(connections: readonly ResolvedConnectionDefinition[]);
    /** Replaces the dynamic connections, by reaction, and closes clients whose definition changed. */
    replaceDynamicConnections(connectionsByResolver: ReadonlyMap<string, readonly ResolvedConnectionDefinition[]>): Promise<void>;
    /**
     * Returns the client for the named connection, creating it on first
     * access. The connection's `protocol` selects the client type.
     */
    getClient(connectionName: string): ConnectionClient;
    /**
     * Returns the authored approval function for the named connection,
     * or `undefined` if the connection did not specify one.
     */
    getConnectionApproval(connectionName: string): Approval | undefined;
    /**
     * Returns all registered connection names.
     */
    getConnectionNames(): readonly string[];
    /** The names of the connections the agent declares, without the dynamic ones installed. */
    getStaticConnectionNames(): readonly string[];
    /**
     * Returns the resolved definitions for all connections.
     */
    getConnections(): readonly ResolvedConnectionDefinition[];
    /**
     * Closes all active client connections.
     */
    dispose(): Promise<void>;
}
