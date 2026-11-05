/**
 * Workflow metadata is deployment-specific, so on Vercel it can point at
 * the generated deployment URL. Production callbacks need the stable
 * project production URL instead so other services can post back through
 * the same trusted source configuration users set up for the production
 * agent.
 */
export declare function resolveVercelProductionCallbackBaseUrl(): string | null;
/**
 * Resolves the base URL used for framework-owned workflow callbacks.
 *
 * Workflow metadata falls back to port 3000 when its optional local port
 * discovery is unavailable. eve already configures the local world with the
 * active dev-server origin, so prefer that value before the metadata fallback.
 *
 * When {@link EVE_PUBLIC_ROUTE_PREFIX_ENV} is set (baked into deployed
 * Vercel workflow functions for named multi-agent mounts), the prefix is
 * appended so callbacks built from this base resolve to the agent's public
 * `<prefix>/eve/v1/*` mount instead of the bare `/eve/v1/*` path the origin
 * does not serve.
 */
export declare function resolveWorkflowCallbackBaseUrl(metadataUrl: string): string;
/**
 * Builds a framework-owned callback URL that a browser or third party sees,
 * such as the connection sign-in redirect handed to an IdP.
 *
 * `callbackPath` is appended to the full base URL rather than resolved
 * against it: the base may carry a public route prefix path, which
 * `new URL(path, base)` would drop for absolute paths.
 */
export declare function createBrowserCallbackUrl(baseUrl: string, callbackPath: string): string;
/**
 * Builds a framework-owned callback URL for server-to-server delivery.
 *
 * The URL carries only the callback's scoped capability. Deployment protection
 * credentials belong to the delivering deployment's trusted-origin transport.
 */
export declare function createWorkflowCallbackUrl(baseUrl: string, callbackPath: string): string;
