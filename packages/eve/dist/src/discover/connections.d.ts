import { type DiscoverDiagnostic } from "#discover/diagnostics.js";
import { type ConnectionSourceRef } from "#discover/manifest.js";
import type { ProjectSource, ProjectSourceEntry } from "#discover/project-source.js";
/**
 * Result of discovering authored connection sources from a single agent root.
 */
interface DiscoverConnectionSourcesResult {
    connections: ConnectionSourceRef[];
    diagnostics: DiscoverDiagnostic[];
}
/**
 * Discovers authored connections under `agent/connections/`.
 */
export declare function discoverConnectionSources(input: {
    rootEntries: readonly ProjectSourceEntry[];
    rootPath: string;
    source: ProjectSource;
}): Promise<DiscoverConnectionSourcesResult>;
export {};
