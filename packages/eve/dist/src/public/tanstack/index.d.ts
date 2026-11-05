import type { Plugin } from "vite";
/**
 * Options for the eve TanStack Start Vite plugin.
 */
export interface EveTanStackPluginOptions {
    /**
     * Maximum time in milliseconds to wait for the eve development server to
     * start, including waiting for another TanStack Start process to start it.
     * Defaults to 180000 (three minutes).
     */
    readonly devServerTimeoutMs?: number;
    /**
     * Path to the eve application root, relative to the TanStack Start project
     * root unless absolute. Defaults to the TanStack Start project root.
     */
    readonly eveRoot?: string;
    /**
     * Command that builds the eve app inside the generated Vercel eve service.
     * Defaults to running the installed eve binary from the TanStack Start
     * app's dependencies (`node <path-to>/eve/bin/eve.js build`).
     */
    readonly eveBuildCommand?: string;
}
/**
 * Vite plugin for running an eve agent alongside a TanStack Start app.
 *
 * TanStack Start reaches Vercel through Nitro, so the app must register
 * `nitro()` from `nitro/vite`; `eveTanStack` configures Nitro to route eve.
 *
 * In development, Nitro proxies eve protocol endpoints to a local eve server.
 * It resolves the server in order: the `EVE_BASE_URL` env var if set, then a
 * healthy shared eve dev server already running for the app, then a freshly
 * spawned `eve dev --no-ui --port 0`. A server spawned by the plugin stops
 * when the Vite dev server closes.
 *
 * On Vercel builds, `eveTanStack` adds the eve runtime as a sibling Vercel
 * service and routes its transport requests before TanStack Start's own
 * routing, including routes declared in `nitro({ vercel: { config } })`.
 */
export declare function eveTanStack(options?: EveTanStackPluginOptions): Plugin;
