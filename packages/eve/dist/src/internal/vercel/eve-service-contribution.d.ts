import type { GeneratedVercelServiceConfig, VercelRouteConfig } from "#internal/vercel/vercel-services-config.js";
export interface EveVercelAgentTarget {
    readonly appRoot: string;
    readonly buildCommand: string;
    readonly devCommand?: string;
    readonly name?: string;
    readonly publicRoutePrefix: string;
    readonly workspaceMember?: boolean;
}
export interface EveVercelBuildTarget {
    readonly hostOutputDirectory: string;
    readonly projectRoot: string;
}
interface EveVercelServiceContribution {
    readonly homeRouteSrc: string | undefined;
    readonly rootDirectory: string;
    readonly routeSrc: string;
    readonly service: GeneratedVercelServiceConfig;
    readonly serviceName: string;
}
/** Derive a stable Vercel service identifier without restricting the public agent name. */
export declare function createEveServiceName(name: string | undefined): string;
export declare function createEveServiceRouteSrc(publicRoutePrefix: string): string;
export declare function createEveRequestPathRoute(routeSrc: string): VercelRouteConfig;
export declare function createEveHomeRouteSrc(publicRoutePrefix: string): string | undefined;
export declare function createEvePublicRoute(serviceName: string, routeSrc: string): VercelRouteConfig;
/** Compile one eve agent into its complete Vercel service and ingress contribution. */
export declare function compileEveVercelService(input: {
    readonly agent: EveVercelAgentTarget;
    readonly target: EveVercelBuildTarget;
}): EveVercelServiceContribution;
export {};
