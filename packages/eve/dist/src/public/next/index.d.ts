/**
 * Structural shape of a Next.js config function: receives the build `phase` and
 * a `context` containing `defaultConfig`, and returns a config (or a promise of
 * one). This is the form {@link withEve} returns.
 */
export type WithEveConfigFunction<TConfig extends object = object> = (phase: string, context: {
    readonly defaultConfig: TConfig;
}) => TConfig | Promise<TConfig>;
/**
 * Next.js config input that {@link withEve} accepts.
 */
export type WithEveConfigInput<TConfig extends object = object> = WithEveConfigFunction<TConfig> | TConfig;
/**
 * Configuration for one named eve agent mounted by {@link withEve}.
 */
export interface WithEveAgentOptions {
    /**
     * Path to the eve application root, relative to `process.cwd()` unless
     * absolute.
     */
    readonly root: string;
    /**
     * Build command for this generated eve Vercel service. Defaults to
     * {@link WithEveOptions.eveBuildCommand}, then a generated command that runs
     * the installed eve binary from this agent root.
     */
    readonly buildCommand?: string;
    /**
     * Private route namespace for this agent's manually configured Vercel
     * service and non-Vercel production proxying.
     */
    readonly servicePrefix?: string;
}
/**
 * Map of agent names to roots or per-agent configuration.
 */
export type WithEveAgentsConfig = Record<string, string | WithEveAgentOptions>;
/**
 * Options for {@link withEve}.
 */
export interface WithEveOptions {
    /**
     * Maximum time in milliseconds to wait for the eve development server to
     * start, including waiting for another Next.js process to start it. Defaults
     * to 180000 (three minutes).
     */
    readonly devServerTimeoutMs?: number;
    /**
     * Path to an eve project root, relative to the Next.js app root unless
     * absolute. The root may contain one `agent/` or an `agents/` workspace.
     * Defaults to the Next.js app root.
     */
    readonly eveRoot?: string;
    /**
     * Named eve agents to mount under `/eve/<name>/v1/*`.
     *
     * Use this when one Next.js app needs to talk to multiple eve agents outside
     * a project-level `agents/` workspace. When unset, withEve discovers a
     * workspace at the Next.js app root automatically. Do not combine with
     * {@link eveRoot}; the single-agent form remains the shorthand for one
     * unnamed agent mounted at `/eve/v1/*`.
     */
    readonly agents?: WithEveAgentsConfig;
    /**
     * Build command for the generated eve Vercel service. In multi-agent mode
     * this is the default for agents without their own `buildCommand`.
     *
     * When omitted, withEve generates a command that runs the installed eve
     * binary from the agent root.
     */
    readonly eveBuildCommand?: string;
    /**
     * Private route namespace for manually configured Vercel services and
     * non-Vercel production proxying. Defaults to `/_eve_internal/eve`.
     * `withEve` normalizes the prefix (adds a leading
     * slash, strips trailing slashes) and rejects a prefix that resolves to the
     * root route.
     */
    readonly servicePrefix?: string;
}
/**
 * Wraps a Next.js config so same-origin eve endpoints proxy to a separate eve
 * service.
 *
 * In development, starts `eve dev --no-ui --port 0` for the eve app and
 * rewrites eve protocol endpoints to that local URL. During `next build`,
 * builds each agent's mounted source-backed workspace extensions so the
 * Next.js type check can resolve them. In Vercel production,
 * writes Build Output service routes so Vercel sends eve protocol endpoints to
 * the eve service directly.
 * Outside Vercel production, serves an existing `.output/server/index.mjs` build
 * on a stable local port when present; otherwise set `EVE_NEXT_PRODUCTION_ORIGIN`
 * to the origin serving the eve service namespace.
 */
export declare function withEve<TConfig extends object>(configOrFunction: WithEveConfigInput<TConfig>, options?: WithEveOptions): WithEveConfigFunction<TConfig>;
