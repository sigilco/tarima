import { z } from "#compiled/zod/index.js";
import type { CompiledAgentManifest, CompiledAgentNodeManifest, CompiledAgentResources } from "#compiler/manifest.js";
import { type AgentSourceRegistry, type CompiledModuleBinding } from "#compiler/source-graph.js";
export { resolveExtensionBindingMountId } from "#compiler/load-binding-namespace.js";
export type CompiledModuleMap = z.infer<typeof compiledModuleMapSchema>;
export declare const compiledModuleMapSchema: z.ZodObject<{
    nodes: z.ZodRecord<z.ZodString, z.ZodObject<{
        modules: z.ZodRecord<z.ZodString, z.ZodObject<{}, z.core.$loose>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
interface CreateCompiledModuleMapSourceInput {
    importSpecifierStyle?: "absolute" | "relative";
    manifest: CompiledAgentManifest;
    moduleMapPath: string;
    programmaticLoaderImportSpecifier?: string;
}
interface BoundModule {
    readonly binding: CompiledModuleBinding;
    readonly sourceId: string;
}
/** Generates the authoritative module-map artifact from required bindings. */
export declare function createCompiledModuleMapSource(input: CreateCompiledModuleMapSourceInput): string;
/** Loads the same binding set used by generated maps without fabricating descriptors. */
export declare function createProgrammaticCompiledModuleMap(manifest: CompiledAgentManifest, registries: readonly AgentSourceRegistry[]): Promise<CompiledModuleMap>;
/** Returns one compiled node's finalized runtime entries, including remote config modules. */
export declare function collectRuntimeModuleBindingsForManifest(manifest: CompiledAgentNodeManifest | CompiledAgentResources): readonly BoundModule[];
