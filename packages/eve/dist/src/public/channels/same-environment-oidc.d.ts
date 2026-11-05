import { type AuthFn } from "#public/channels/auth.js";
/**
 * Vercel OIDC from this project in the current environment only. Tokens from
 * the project's other environments, such as a preview deployment, authenticate
 * as `service` and must not reach this deployment's inbound channel routes.
 */
export declare function sameEnvironmentVercelOidc(): AuthFn<Request>;
