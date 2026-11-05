/**
 * Options for the eve Nuxt module.
 */
export interface EveNuxtModuleOptions {
    /**
     * Maximum time in milliseconds to wait for the eve development server to
     * start, including waiting for another Nuxt process to start it. Defaults
     * to 180000 (three minutes).
     */
    devServerTimeoutMs?: number;
    /**
     * Path to the eve application root, resolved relative to the Nuxt project
     * root unless absolute. Defaults to the Nuxt project root. The dev server is
     * spawned here, and on Vercel it is the root the generated eve service
     * builds from.
     */
    eveRoot?: string;
    /**
     * Command that builds the eve app inside the generated Vercel eve service.
     * Defaults to running the installed eve binary from the Nuxt app's
     * dependencies (`node <path-to>/eve/bin/eve.js build`).
     */
    eveBuildCommand?: string;
}
/** Opaque setup entry consumed by Nuxt. Register it in `modules`, rather than invoking it directly. */
export interface EveNuxtModule {
    (options: EveNuxtModuleOptions, nuxt: object): void;
}
/**
 * Nuxt module that wires an eve agent into a Nuxt app. Register under `modules`
 * (configured via the `eve` config key). It auto-imports the `useEveAgent()`
 * composable and routes eve transport requests (`/eve/v1/**`) to the eve
 * service: a shared dev server spawned on demand in dev, a generated Vercel
 * service on Vercel deployments, and a configured origin/port in non-Vercel
 * production. Requires Nuxt >= 4.0.0. Configure via
 * {@link EveNuxtModuleOptions}.
 */
declare const eveNuxtModule: EveNuxtModule;
export default eveNuxtModule;
