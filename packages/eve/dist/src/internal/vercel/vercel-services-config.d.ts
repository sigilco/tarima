import { type JsonValue } from "#shared/json.js";
export interface VercelServiceMount {
    readonly path?: string;
    readonly subdomain?: string;
}
export interface VercelServiceRouteDestination {
    readonly service?: string;
    readonly type?: string;
}
export interface VercelRouteTransform {
    readonly args?: string;
    readonly op?: string;
    readonly type?: string;
    readonly [key: string]: JsonValue | undefined;
}
export interface VercelRouteConfig {
    readonly destination?: string | VercelServiceRouteDestination;
    readonly handle?: string;
    readonly src?: string;
    readonly transforms?: readonly VercelRouteTransform[];
    readonly [key: string]: unknown;
}
export interface VercelServiceConfig {
    readonly buildCommand?: string;
    readonly devCommand?: string;
    readonly entrypoint?: string;
    readonly framework?: string;
    readonly mount?: string | VercelServiceMount;
    readonly outputDirectory?: string;
    readonly routes?: readonly VercelRouteConfig[];
    readonly routePrefix?: string;
    readonly root?: string;
    readonly type?: string;
}
export interface GeneratedVercelServiceConfig extends VercelServiceConfig {
    readonly buildCommand: string;
    readonly framework: "eve";
    readonly outputDirectory: ".vercel/output";
    readonly root: string;
    readonly routes: readonly VercelRouteConfig[];
}
export type VercelServicesCollection = Record<string, VercelServiceConfig> | readonly (VercelServiceConfig & {
    readonly name: string;
})[];
export interface VercelServicesConfig {
    readonly experimentalServices?: JsonValue;
    readonly experimentalServicesV2?: JsonValue;
    readonly routes?: readonly VercelRouteConfig[];
    readonly services?: VercelServicesCollection;
    readonly [key: string]: unknown;
}
/** Parse the Vercel configuration fields used by eve while preserving other JSON fields. */
export declare function parseVercelServicesConfig(value: unknown, fileName: string): VercelServicesConfig;
export declare function createServiceConfigRecord(services: VercelServicesCollection | undefined): Record<string, VercelServiceConfig>;
export declare function hasServices(services: VercelServicesCollection | undefined): services is VercelServicesCollection;
export declare function readVercelJsonFile(path: string): Promise<VercelServicesConfig>;
