import type { NitroEventHandler } from "nitro/types";
import type { NormalizedChannelCorsOptions } from "#channel/cors.js";
import type { CompiledAgentManifest } from "#compiler/manifest.js";
import type { ChannelRouteMethod } from "#public/definitions/channel.js";
import type { ScheduleRegistration } from "#runtime/schedules/register.js";
import type { NitroArtifactsConfig } from "#internal/nitro/routes/runtime-artifacts.js";
import type { WorkflowArtifacts } from "#internal/workflow-bundle/builder.js";
/** The dedicated Vercel function a route needs instead of the shared server function. */
export type HostRouteVercelFunction = "schedule-queue" | "workflow-queue";
type HostRoute = {
    readonly kind: "channel";
    readonly method: ChannelRouteMethod;
    readonly path: string;
    readonly cors?: NormalizedChannelCorsOptions;
    /**
     * Set on the GET handler of a path with no HEAD route (an HTTP GET
     * route, else a WebSocket route): every method declared for the path.
     * The handler answers HEAD with 405 and this `Allow` set.
     */
    readonly allow?: readonly string[];
} | {
    readonly kind: "channel-preflight";
    readonly method: "OPTIONS";
    readonly path: string;
    readonly cors: NormalizedChannelCorsOptions;
} | {
    readonly kind: "connection-event";
    readonly method: "POST";
    readonly path: string;
    readonly connectionName: string;
} | {
    readonly kind: "development-schedule";
    readonly method: "POST";
    readonly path: string;
} | {
    readonly kind: "schedule-consumer";
    readonly method: "POST";
    readonly path: string;
    readonly vercelFunction: "schedule-queue";
} | {
    readonly kind: "workflow";
    readonly method: "ALL";
    readonly path: string;
    /** Registers the bundle's `POST` on the worker's own world queue. */
    readonly directQueuePrefix?: string;
    readonly vercelFunction: "workflow-queue";
};
export interface HostRouteTable {
    readonly routes: readonly HostRoute[];
    readonly scheduleTasks: readonly ScheduleRegistration[];
    /** The Vercel cron path; the Vercel preset registers its handler. */
    readonly cronHandlerRoute?: string;
}
interface HostRouteTableInput {
    readonly manifest: Pick<CompiledAgentManifest, "channelRoutes" | "config"> & Partial<Pick<CompiledAgentManifest, "connections" | "scheduleCollections">>;
    readonly mode: "development" | "production";
    readonly scheduleRegistrations: readonly ScheduleRegistration[];
    readonly vercel: boolean;
}
/** Every route, task, and cron path eve's Nitro host serves, in registration order. */
export declare function createHostRouteTable(input: HostRouteTableInput): HostRouteTable;
export interface HostNitroRoutes {
    readonly experimental?: {
        readonly tasks: true;
    };
    readonly handlers: NitroEventHandler[];
    readonly scheduledTasks: Record<string, string | string[]>;
    readonly tasks: Record<string, {
        readonly description: string;
        readonly handler: string;
    }>;
    readonly virtual: Record<string, string>;
}
/**
 * Renders the route table into Nitro config. Writes the artifacts config every
 * route module shares to `artifactsConfigPath` and the workflow handler file
 * beside the workflow bundle; everything else is a virtual module.
 */
export declare function renderHostRoutes(table: HostRouteTable, input: {
    readonly artifactsConfig: NitroArtifactsConfig;
    readonly artifactsConfigPath: string;
    readonly workflowArtifacts: WorkflowArtifacts;
    readonly workflowWorldPluginPath?: string;
}): Promise<HostNitroRoutes>;
/**
 * The workflow route's handler file, written beside the bundle. It stays a
 * file because it registers queue handlers as top-level side effects, and
 * Nitro virtual modules default to `moduleSideEffects: false`.
 */
export declare function workflowHandlerPath(workflowArtifacts: WorkflowArtifacts): string;
export {};
