/**
 * Scope vocabulary for API keys.
 *
 * The contract (`@tarima/contract` apiKeySchema) publishes four scopes:
 * projects:read, projects:write, entities:read, entities:write. The api
 * app needs a few more to describe its own surface (managing keys,
 * triggering workflows), and the contract is owned by another team, so
 * this module keeps the api-side catalog as an explicit SUPERSET of the
 * contract list. Every scope listed here is accepted when minting a key;
 * the contract picklist stays the subset that the web/CLI clients know.
 *
 * Scope checks are OR semantics: `hasScope(granted, required)` is true
 * when the key carries AT LEAST ONE of the required scopes. A single
 * entry list therefore behaves exactly like "must carry this scope".
 */
export const API_SCOPES = [
  "api-keys:read",
  "api-keys:write",
  "projects:read",
  "projects:write",
  "entities:read",
  "entities:write",
  "workflows:read",
  "workflows:write",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

/** True when `value` is a scope the api knows about. */
export function isApiScope(value: string): value is ApiScope {
  return (API_SCOPES as readonly string[]).includes(value);
}

/**
 * True when the granted scopes satisfy the requirement. An empty
 * requirement is always satisfied; a non-empty one needs at least one
 * of the listed scopes (OR semantics, see the module header).
 */
export function hasScope(granted: readonly string[], required: readonly string[]): boolean {
  if (required.length === 0) return true;
  return required.some((scope) => granted.includes(scope));
}
