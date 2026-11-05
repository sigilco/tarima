import { type CompiledSandboxDefinition } from "#compiler/manifest.js";
import type { CompiledModuleMap } from "#compiler/module-map.js";
import type { ResolvedSandboxDefinition } from "#runtime/types.js";
export declare function resolveSandboxDefinition(definition: CompiledSandboxDefinition, moduleMap: CompiledModuleMap, nodeId: string | undefined): Promise<ResolvedSandboxDefinition>;
