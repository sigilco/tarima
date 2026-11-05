/** Sign-in shared by connection tool calls, searches, and connecting a connection. */
import type { ConnectionRegistry } from "#runtime/connections/registry-types.js";
import { createAuthorizationExecution, type ScopedAuthorization } from "#runtime/connections/scoped-authorization.js";
import type { ResolvedConnectionDefinition } from "#runtime/types.js";
import { type ConnectionClient, type ConnectionToolMetadata } from "#shared/connection-types.js";
/** A connection ready for one call, with any sign-in the user finished completed. */
export interface ConnectionSession {
    /** Completes and starts sign-in for this call, and guards against a sign-in loop. */
    readonly auth: ReturnType<typeof createAuthorizationExecution>;
    readonly client: ConnectionClient;
    /** The connection's interactive sign-in, when it supports one. */
    readonly scoped: ScopedAuthorization | undefined;
}
/**
 * Completes the sign-in the user finished for `connection`, if any, before a
 * search, a sign-in, or a tool call uses its client. It never prompts; a caller
 * that needs sign-in starts it through `auth`.
 */
export declare function completeConnectionSignIn(registry: ConnectionRegistry, connection: ResolvedConnectionDefinition): Promise<ConnectionSession>;
/** A connection's tools, or why they can't be listed. */
export type ConnectionListing = {
    readonly tools: readonly ConnectionToolMetadata[];
}
/** Listable once the user signs in; `error` is the listing's request for sign-in. */
 | {
    readonly authorization: ScopedAuthorization;
    readonly error: unknown;
} | {
    readonly failure: string;
};
export declare function listConnectionTools(connection: ResolvedConnectionDefinition, { auth, client, scoped }: ConnectionSession): Promise<ConnectionListing>;
/**
 * A connection's tools, or a timeout error once listing them takes longer than
 * {@link LISTING_TIMEOUT_MS}, so one hung server can't stall a step. Clients
 * share one in-flight listing and take no signal, so this stops waiting rather
 * than cancelling: a late result fills only that client's cache, and the race
 * handles a late rejection. Event discovery runs under the same deadline.
 * The connection's `tools` filter applies to everything listed, remote tools
 * and eve's event actions alike, and a call only runs a listed tool.
 */
export declare function listToolMetadata(connection: Pick<ResolvedConnectionDefinition, "connectionName" | "tools">, client: ConnectionClient): Promise<readonly ConnectionToolMetadata[]>;
/** Why a connection's tools could not be listed, for a failure other than a needed sign-in. */
export declare function listingFailureMessage(connectionName: string, error: unknown): string;
