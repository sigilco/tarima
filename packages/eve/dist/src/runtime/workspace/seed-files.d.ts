import type { SandboxProviderResourceFile } from "#shared/sandbox-provider.js";
/** The files of one resource directory, split into the trees sandbox providers receive. */
export interface MaterializedResourceTrees {
    readonly skills: readonly SandboxProviderResourceFile[];
    readonly workspace: readonly SandboxProviderResourceFile[];
}
/**
 * Reads a compiled resource directory into its `workspace/` and `skills/`
 * trees, each sorted by relative path. A directory with neither subdirectory
 * is read as the workspace tree itself.
 */
export declare function materializeWorkspaceDirectory(sourceDirectoryPath: string): Promise<MaterializedResourceTrees>;
