import type { RouteContext } from "#public/definitions/channel.js";
/** The path `createWebhook()` mints, so external systems call back without knowing eve. */
export declare const WORKFLOW_WEBHOOK_ROUTE_PATTERN = "/.well-known/workflow/v1/webhook/:token";
export declare function handleWorkflowWebhookRequest(request: Request, ctx: RouteContext): Promise<Response>;
