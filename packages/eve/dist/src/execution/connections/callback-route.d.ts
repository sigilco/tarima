/**
 * Framework-shipped callback route used by in-turn interactive
 * connection authorization.
 *
 * The connection callback route is the
 * redirect target the workflow body hands to the IdP via
 * `startAuthorization`. When the IdP redirects the user's browser back
 * with the OAuth `code`/`state` (or whatever payload the protocol
 * carries), this handler:
 *
 * 1. Parses the inbound request into a JSON-serializable
 *    {@link AuthorizationCallback} (params only — never request headers).
 * 2. Calls `resumeHook(token, payload)` to wake the suspended workflow.
 * 3. Renders a static landing page so the user sees a friendly UI
 *    instead of an empty `202 Accepted`: "Authorization complete", or
 *    "Authorization not completed" when the IdP returned an OAuth `error`.
 *
 * Owning this route in the framework - instead of routing the IdP at the
 * workflow runtime's raw `/.well-known/workflow/v1/webhook/:token` -
 * keeps the public surface namespaced under eve and lets the framework
 * decide delivery policy (auth, throttling, logging) for connection
 * callbacks without leaking generic workflow primitives to the public
 * internet.
 */
import type { RouteContext } from "#public/definitions/channel.js";
/** Resumes the exact authorization attempt through the session inbox. */
export declare function handleConnectionCallbackRequest(request: Request, ctx: RouteContext): Promise<Response>;
