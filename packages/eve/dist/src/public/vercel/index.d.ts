/** A route accepted by eve's Vercel configuration composer. */
export interface EveVercelRouteConfig {
    readonly destination?: string | {
        readonly service?: string;
        readonly type?: string;
    };
    readonly handle?: string;
    readonly src?: string;
    readonly transforms?: readonly Record<string, unknown>[];
    readonly [key: string]: unknown;
}
/** A service accepted by eve's Vercel configuration composer. */
export interface EveVercelServiceConfig {
    readonly buildCommand?: string;
    readonly entrypoint?: string;
    readonly framework?: string;
    readonly mount?: string | {
        readonly path?: string;
        readonly subdomain?: string;
    };
    readonly outputDirectory?: string;
    readonly routes?: readonly EveVercelRouteConfig[];
    readonly root?: string;
    readonly type?: string;
    readonly [key: string]: unknown;
}
/** The portion of a programmatic Vercel configuration composed by eve. */
export interface EveVercelConfig {
    readonly experimentalServices?: unknown;
    readonly experimentalServicesV2?: unknown;
    readonly routes?: readonly EveVercelRouteConfig[];
    readonly services?: Readonly<Record<string, EveVercelServiceConfig>> | readonly (EveVercelServiceConfig & {
        readonly name: string;
    })[];
    readonly [key: string]: unknown;
}
/** Options for composing an eve workspace into a programmatic Vercel configuration. */
export interface WithEveOptions {
    /** Eve workspace root. Defaults to the workspace containing the directory evaluating `vercel.ts`. */
    readonly root?: string;
}
/**
 * Add an eve project's generated agent services and transport routes to `vercel.ts`.
 *
 * The returned object is a plain Vercel configuration. Vercel resolves it before independently
 * building the authored services and each generated eve agent service.
 */
export declare function withEve<TConfig extends EveVercelConfig>(config: TConfig, options?: WithEveOptions): Promise<Omit<TConfig, "routes" | "services"> & {
    readonly routes: readonly EveVercelRouteConfig[];
    readonly services: Readonly<Record<string, EveVercelServiceConfig>>;
}>;
