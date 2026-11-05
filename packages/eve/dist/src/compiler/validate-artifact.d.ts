import type { CompiledAgentManifest, CompiledAgentNodeManifest, CompiledAgentResources } from "#compiler/manifest.js";
import type { CompiledModuleMap } from "#compiler/module-map.js";
type CompiledNode = CompiledAgentNodeManifest | CompiledAgentResources;
/** Validates invariants that cannot be expressed by the serialized Zod shape. */
export declare function validateCompiledAgentManifest(manifest: CompiledAgentManifest): void;
/** Validates exact module-map parity with the manifest's required binding tables. */
export declare function validateCompiledModuleMap(manifest: CompiledAgentManifest, moduleMap: CompiledModuleMap): void;
/** Validates one node's bindings, composition, and route-plan integrity. */
export declare function validateCompiledAgentResources(node: CompiledNode, options?: {
    readonly additionalModuleSources?: readonly {
        readonly logicalPath: string;
        readonly sourceId: string;
    }[];
    readonly activeResourceSourceIds?: readonly string[];
    readonly allowUnknownResourceWinners?: boolean;
}): void;
export {};
