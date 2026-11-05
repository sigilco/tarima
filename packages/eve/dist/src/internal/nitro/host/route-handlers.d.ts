import type { NormalizedChannelCorsOptions } from "#channel/cors.js";
/** The Nitro virtual id of the artifacts config every route module shares. */
export declare const ROUTE_CONFIG_ID = "#eve/route-config";
/**
 * The `#eve/route-config` module. The config reaches the bundle through a
 * `text:` import so Nitro's `replace` cannot rewrite paths inside it.
 */
export declare function renderRouteConfigModule(input: {
    readonly configPath: string;
}): string;
/**
 * A channel HTTP route: optional CORS and HEAD guard, then channel dispatch.
 * With `websocketRouteKey`, the same GET handler also answers WebSocket
 * upgrades on its path, since an upgrade arrives as a GET.
 */
export declare function renderChannelHandler(input: {
    readonly allow?: readonly string[];
    readonly cors?: NormalizedChannelCorsOptions;
    readonly routeKey: string;
    readonly websocketRouteKey?: string;
}): string;
/** The preflight answer for a CORS-enabled channel path. */
export declare function renderChannelPreflightHandler(input: {
    readonly cors: NormalizedChannelCorsOptions;
}): string;
/** A WebSocket-only channel path, with the HEAD guard when its path has no HEAD route. */
export declare function renderChannelWebSocketHandler(input: {
    readonly allow?: readonly string[];
    readonly routeKey: string;
}): string;
/**
 * A framework route. The handler receives the shared artifacts config, plus
 * any build-time `context` fields alongside it, and the request, so it can
 * still authenticate per request.
 */
export declare function renderHostHandler(input: {
    readonly context?: Readonly<Record<string, string>>;
    readonly handlerExport: string;
    readonly modulePath: string;
}): string;
/**
 * Nitro task modules default-export an object with `run`. Importing
 * `defineTask` from `"nitro/task"` would fail on Vercel, where `nitro` is a
 * build-only dependency outside the function trace.
 */
export declare function renderScheduleTaskModule(input: {
    readonly description: string;
}): string;
/**
 * The physical handler beside the workflow bundle. It re-exports the bundle's
 * `POST` as the route handler and, for a direct queue, registers that `POST`
 * on the workflow world at module load so the first queue dispatch on this
 * worker skips the HTTP loopback. It stays a file, not a virtual module:
 * Nitro virtuals default to `moduleSideEffects: false`, which would drop that
 * registration.
 */
export declare function renderWorkflowFileHandler(input: {
    readonly direct?: {
        readonly queuePrefix: string;
        readonly runtimeImportSpecifier: string;
        readonly workflowWorldPluginImportSpecifier?: string;
    };
    readonly workflowsImportSpecifier: string;
}): string;
