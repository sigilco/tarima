import type { AgentSourceManifest } from "#discover/manifest.js";
import { type CompiledAgentManifest } from "#compiler/manifest.js";
import type { CompileAgentManifestOptions } from "#compiler/normalize-manifest-types.js";
export type { CompileAgentManifestOptions } from "#compiler/normalize-manifest-types.js";
export declare function compileAgentManifest(manifest: AgentSourceManifest, options?: CompileAgentManifestOptions): Promise<CompiledAgentManifest>;
