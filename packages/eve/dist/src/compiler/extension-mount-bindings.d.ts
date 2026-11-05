import type { CompiledAgentManifest } from "#compiler/manifest.js";
import type { AgentModuleBinding } from "#compiler/source-graph.js";
/** Mount association is independent of ownership: overrides stay application-owned. */
export declare function bindingMountId(binding: AgentModuleBinding): string | undefined;
export declare function extensionOverridePaths(manifest: CompiledAgentManifest): ReadonlyMap<string, string>;
