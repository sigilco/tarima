import type { CompiledSandboxDefinition } from "#compiler/manifest.js";
import type { ModuleBackedDefinitionLoadOptions } from "#compiler/normalize-helpers.js";
import type { ModuleSourceRef } from "#shared/source-ref.js";
export declare function compileSandboxDefinition(_agentRoot: string, source: ModuleSourceRef, options: ModuleBackedDefinitionLoadOptions): Promise<CompiledSandboxDefinition>;
