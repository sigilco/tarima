import type { HostRouteTable } from "#internal/nitro/host/host-routes.js";
/**
 * Publishes a Vercel service build through one eve-owned server function.
 * Upstream ask: a configurable or `serverDir`-derived catch-all fallback.
 *
 * Nitro emits a symlinked function and a route for every handler, all aimed
 * at the root `__server.func`, plus a `/(.*)` fallback to it. The root
 * function and its fallback would collide with the host's, so the shared
 * function moves to `eve/__server.func`. A route with its own Vercel function,
 * such as a queue consumer, keeps that function, its route, and its trigger;
 * those routes are static, so the function directory is the path itself.
 * Other functions and route destinations in {@link SERVICE_NAMESPACES} are
 * served by the shared function; everything else is pruned.
 */
export declare function normalizeVercelServiceOutput(outputDir: string, routeTable: Pick<HostRouteTable, "routes">): Promise<void>;
