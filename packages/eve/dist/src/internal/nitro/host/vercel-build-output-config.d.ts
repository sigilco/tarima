import type { HostRouteTable } from "#internal/nitro/host/host-routes.js";
import { EVE_WORKFLOW_FLOW_ROUTE_PATH } from "#internal/workflow-bundle/flow-route.js";
export { EVE_WORKFLOW_FLOW_ROUTE_PATH };
/**
 * Builds eve's Vercel preset options.
 *
 * Each route that needs its own function gets a `functionRules` entry, so
 * Nitro emits a dedicated `.func` from the same build output carrying the
 * agent's queue trigger, an extended execution window, and the environment
 * the deployed runtime needs. Every other function setting (runtime, memory,
 * streaming) is inherited from the base server function config.
 */
export declare function createEveVercelOptions(input: {
    agentName: string;
    enabled: boolean;
    publicRoutePrefix?: string;
    routeTable: Pick<HostRouteTable, "cronHandlerRoute" | "routes">;
    workspaceMember?: boolean;
}): {
    config: {
        version: 3;
        framework: {
            slug: string;
            version: string;
        };
    };
    cronHandlerRoute?: string | undefined;
    functionRules: {
        [k: string]: {
            maxDuration: "max";
            experimentalTriggers: ({
                type: "queue/v2beta";
                topic: string;
                retryAfterSeconds: number;
                initialDelaySeconds: number;
                maxDeliveries: number;
            } | {
                type: "queue/v2beta";
                topic: string;
                consumer: string;
                retryAfterSeconds: number;
                initialDelaySeconds: number;
            })[];
            environment: Record<string, string>;
        };
    };
} | undefined;
