import type { SessionContext } from "#context/session-context.js";
import type { ResolvedConnectionDefinition } from "#runtime/types.js";
import type { AuthorizationDefinition } from "#shared/connection-types.js";
type ResolvedAuthorization = Readonly<AuthorizationDefinition> | undefined;
/**
 * Resolves and validates the auth provider for the active connection call.
 * Dynamic providers are cached for the execution step so token resolution,
 * interactive OAuth, and eviction all use the same provider instance.
 */
export declare function resolveConnectionAuthorization(connection: ResolvedConnectionDefinition, ctx?: SessionContext): Promise<ResolvedAuthorization>;
export {};
