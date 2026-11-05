import type { MemoryDefinition } from "#public/memory/index.js";
import type { ModuleSourceRef } from "#shared/source-ref.js";
/** What a module that doesn't export a `defineMemory()` value reads. */
export declare function memoryMismatch(source: Pick<ModuleSourceRef, "exportName" | "logicalPath">): string;
export declare function normalizeMemoryDefinition(value: unknown, message: string): MemoryDefinition;
