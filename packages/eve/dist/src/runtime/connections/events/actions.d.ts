import type { ResolvedConnectionDefinition, ResolvedConnectionEvents } from "#runtime/types.js";
import type { ConnectionToolExecuteOptions, ConnectionToolMetadata } from "#shared/connection-types.js";
export declare function isEventAction(name: string): boolean;
export declare class ConnectionEventActions {
    private readonly connection;
    private readonly events;
    private readonly headers;
    private readonly transportFetch;
    constructor(connection: ResolvedConnectionDefinition, events: ResolvedConnectionEvents, headers: () => Promise<Record<string, string>>, transportFetch?: typeof fetch);
    private scope;
    private withClient;
    private catalog;
    metadata(): Promise<ConnectionToolMetadata[]>;
    /** Existing watches must remain stoppable when upstream discovery fails. */
    recoveryMetadata(): ConnectionToolMetadata[];
    execute(name: string, input: unknown, options: ConnectionToolExecuteOptions): Promise<unknown>;
}
