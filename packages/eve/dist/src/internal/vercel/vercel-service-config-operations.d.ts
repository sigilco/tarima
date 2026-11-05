import { type EveVercelAgentTarget } from "#internal/vercel/eve-service-contribution.js";
import { type VercelRouteConfig, type VercelServiceConfig, type VercelServicesConfig } from "#internal/vercel/vercel-services-config.js";
export declare function resolveServicePrefix(service: VercelServiceConfig | undefined): string | undefined;
/** Resolve the mounted prefix for the eve service matching an application root. */
export declare function resolveEveServicePrefixByRoot(input: {
    readonly appRoots: readonly string[];
    readonly config: VercelServicesConfig;
    readonly configRoot: string;
}): string | undefined;
export declare function findConfiguredEveServiceEntry(services: Record<string, VercelServiceConfig>, agent: EveVercelAgentTarget): {
    readonly name: string;
    readonly service: VercelServiceConfig;
} | undefined;
export declare function insertEveServiceRequestPathRoute(routes: readonly VercelRouteConfig[] | undefined, routeSrc: string): readonly VercelRouteConfig[];
export declare function insertEveServiceRoutes(routes: readonly VercelRouteConfig[], eveRoutes: readonly {
    readonly routeSrc: string;
    readonly serviceName: string;
}[]): readonly VercelRouteConfig[];
