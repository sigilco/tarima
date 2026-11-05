import type { CompiledAgentManifest } from "#compiler/manifest.js";
import type { DynamicSchedulesDefinition } from "#public/schedules/subscription.js";
import type { CompiledRuntimeAgentBundle } from "#runtime/sessions/compiled-agent-cache.js";
/** The agent does not deploy the named collection, or not with the expected provider. */
export declare class ScheduleCollectionNotDeployedError extends Error {
}
/**
 * Reloads a collection's authored definition inside a durable step or queue
 * callback, where the closure that created the occurrence no longer exists.
 */
export declare function loadScheduleCollectionDefinition(bundle: Pick<CompiledRuntimeAgentBundle, "compiledArtifactsSource" | "moduleMap" | "nodeId">, collection: string, options?: {
    readonly manifest?: CompiledAgentManifest;
    readonly providerKind?: string;
}): Promise<DynamicSchedulesDefinition<unknown>>;
