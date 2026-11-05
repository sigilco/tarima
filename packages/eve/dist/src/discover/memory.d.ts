import { type DiscoverDiagnostic } from "#discover/diagnostics.js";
import type { MemorySourceRef } from "#discover/manifest.js";
import type { ProjectSource, ProjectSourceEntry } from "#discover/project-source.js";
export declare const DISCOVER_MEMORY_SLOT_AMBIGUOUS = "discover/memory-slot-ambiguous";
export declare const DISCOVER_MEMORY_NAME_INVALID = "discover/memory-name-invalid";
export declare function discoverMemorySources(input: {
    readonly rootEntries: readonly ProjectSourceEntry[];
    readonly rootPath: string;
    readonly source: ProjectSource;
}): Promise<{
    readonly diagnostics: DiscoverDiagnostic[];
    readonly memories: MemorySourceRef[];
}>;
