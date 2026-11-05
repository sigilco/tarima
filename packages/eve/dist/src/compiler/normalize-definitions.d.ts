import type { ModuleSourceRef } from "#shared/source-ref.js";
import type { CompiledDefinition } from "#compiler/manifest.js";
import { type ModuleBackedDefinitionLoadOptions } from "#compiler/normalize-helpers.js";
/** A hook, with the events it handles. */
export declare function compileHookEntry(source: ModuleSourceRef, options: ModuleBackedDefinitionLoadOptions): Promise<CompiledDefinition>;
/** A memory, in the slot its path names. */
export declare function compileMemoryDefinition(source: ModuleSourceRef, options: ModuleBackedDefinitionLoadOptions): Promise<CompiledDefinition>;
export declare function deriveMemorySlot(logicalPath: string): string;
