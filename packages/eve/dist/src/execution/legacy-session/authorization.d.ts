import type { AuthorizationCallbackPayload } from "#execution/session-inbox/inbox.js";
/**
 * Delivers an authorization callback to the hook named in its URL. Current
 * URLs carry a physical hook token (a session inbox or a workflow-tool
 * callback); URLs minted by a pre-cutover driver carry that driver's own
 * logical token, which is re-encoded for it or rejected once imported.
 */
export declare function resumeAuthorizationCallback(token: string, payload: AuthorizationCallbackPayload): Promise<void>;
export declare function handleExpiredLegacyAuthorization(): Promise<Response>;
