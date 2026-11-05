import { type EveVercelAgentTarget, type EveVercelBuildTarget } from "#internal/vercel/eve-service-contribution.js";
import type { VercelRouteConfig, VercelServiceConfig } from "#internal/vercel/vercel-services-config.js";
interface EveVercelServiceTarget {
    readonly agent: EveVercelAgentTarget;
    readonly target: EveVercelBuildTarget;
}
interface AssembledEveVercelServices {
    readonly rootDirectories: readonly string[];
    readonly routes: readonly VercelRouteConfig[];
    readonly services: Readonly<Record<string, VercelServiceConfig>>;
}
/** Merge eve agents into one Vercel service graph. */
export declare function assembleEveVercelServices(input: {
    readonly agents: readonly EveVercelServiceTarget[];
    readonly routes?: readonly VercelRouteConfig[];
    readonly services?: Readonly<Record<string, VercelServiceConfig>>;
}): AssembledEveVercelServices;
export {};
