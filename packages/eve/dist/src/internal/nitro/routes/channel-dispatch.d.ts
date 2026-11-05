import type { H3Event } from "nitro";
import type { WebSocketRouteHooks } from "#channel/routes.js";
import { type NitroArtifactsConfig } from "#internal/nitro/routes/runtime-artifacts.js";
/**
 * Dispatches one channel request identified by `routeKey`.
 *
 * Each channel route is mounted as its own virtual Nitro handler with the
 * route key and artifacts config baked in. Nitro's router matches the URL
 * and populates `event.context.params`, so no custom URL matching is
 * needed — the handler looks up the channel by its `(method, urlPath)` key
 * directly. Each task a route registers through `ctx.waitUntil` goes to
 * `event.waitUntil()` as soon as it is registered, including work started
 * while a streamed body is still being sent, so webhook acknowledgements
 * can return immediately.
 *
 * Authored channels receive `RouteHandlerArgs`; framework-internal channels
 * receive the smaller `RouteContext` used by callback routes.
 */
export declare function dispatchChannelRequest(event: H3Event, routeKey: string, config: NitroArtifactsConfig): Promise<Response>;
export declare function dispatchChannelWebSocketRequest(event: H3Event, routeKey: string, config: NitroArtifactsConfig): Promise<WebSocketRouteHooks>;
