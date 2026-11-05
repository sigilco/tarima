import type { CompiledConnectionDefinition } from "#compiler/manifest.js";
import type { CompiledModuleMap } from "#compiler/module-map.js";
import type { ResolvedConnectionDefinition } from "#runtime/types.js";
import type { ModuleSourceRef } from "#shared/source-ref.js";
/**
 * Resolves one compiled connection entry into a runtime-owned definition
 * with the live `auth`, `headers`, and `tools` objects attached
 * from the authored module.
 *
 * The compiled manifest only stores serializable metadata (`url`,
 * `description`, `connectionName`). Live values (`auth`,
 * `headers`, `tools`) are resolved at runtime by re-importing the
 * authored module so they can reference ambient state (environment
 * variables, `AlsContext`, etc.).
 */
export declare function resolveConnectionDefinition(definition: CompiledConnectionDefinition, moduleMap: CompiledModuleMap, nodeId: string | undefined): Promise<ResolvedConnectionDefinition>;
/** Resolves one branded connection returned by a dynamic connection handler. */
export declare function resolveDynamicConnectionValue(value: unknown, source: Readonly<ModuleSourceRef & {
    readonly connectionName: string;
}>): ResolvedConnectionDefinition;
