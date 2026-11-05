import type { CompiledAgentNodeManifest, CompiledAgentResources } from "#compiler/manifest.js";
import type { CompiledModuleMap } from "#compiler/module-map.js";
import type { ResolvedAgent } from "#runtime/types.js";
/**
 * Input for resolving one compiled authored agent into a runtime-owned model.
 */
interface ResolveAgentInput {
    manifest: CompiledAgentNodeManifest | CompiledAgentResources;
    moduleMap: CompiledModuleMap;
    nodeId?: string;
}
/**
 * Resolves the core authored agent path from compiled artifacts.
 */
export declare function resolveAgent(input: ResolveAgentInput): Promise<ResolvedAgent>;
/** The names of the tool files that export `disableTool()`. */
export declare function disabledToolNames(manifest: Pick<CompiledAgentResources, "sourceComposition">): readonly string[];
export {};
