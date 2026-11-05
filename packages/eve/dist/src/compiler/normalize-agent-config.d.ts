import type { AgentSourceManifest } from "#discover/manifest.js";
import type { ModuleSourceRef } from "#shared/source-ref.js";
import type { CompiledAgentDefinition } from "#compiler/manifest.js";
import { type ManifestCompileContext } from "#compiler/normalize-helpers.js";
import type { AgentModuleBinding } from "#compiler/source-graph.js";
/**
 * Compiles the agent-level configuration (model, compaction, build,
 * workspace) for one authored agent node.
 */
export declare function compileAgentConfig(manifest: AgentSourceManifest, context: ManifestCompileContext, options: {
    readonly binding: AgentModuleBinding;
    readonly definition?: unknown;
    readonly source: ModuleSourceRef;
}): Promise<CompiledAgentDefinition>;
