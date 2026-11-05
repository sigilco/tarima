import type { CompiledDefinition, CompiledScheduleCollectionDefinition } from "#compiler/manifest.js";
import type { CompiledModuleMap } from "#compiler/module-map.js";
import type { ResolvedDefinition, ResolvedDynamicSource, ResolvedScheduleCollection } from "#runtime/types.js";
import type { ModuleSourceRef } from "#shared/source-ref.js";
interface Scope {
    readonly moduleMap: CompiledModuleMap;
    readonly nodeId: string | undefined;
    /** The names the agent's tool files take, which an eve feature's tools yield to. */
    readonly toolFiles: ReadonlySet<string>;
}
/** Reattaches the code of a file the agent declares from its module, and checks its shape. */
export declare function resolveDefinition(definition: CompiledDefinition, scope: Scope): Promise<ResolvedDefinition>;
/**
 * Reattaches a schedule collection's definition from its module, and stamps it with where it
 * lives, so `schedules()` binds it wherever the agent's code passes it.
 */
export declare function resolveScheduleCollection(collection: CompiledScheduleCollectionDefinition, scope: Scope): Promise<ResolvedScheduleCollection & {
    readonly kind: "schedules";
}>;
/** Reattaches a compiled `defineDynamic()` export's function from its module. */
export declare function resolveDynamicDefinition<T extends ModuleSourceRef>(definition: T, input: Omit<Scope, "toolFiles"> & {
    readonly kindLabel: string;
}): Promise<T & ResolvedDynamicSource>;
export {};
