/**
 * The single containment check for sandbox paths that tools read or write.
 * The workspace root differs by provider (`/workspace`, `/app`, ...), so the
 * boundary is the real path of `resolvePath("")`, never a literal prefix.
 */
export interface WorkspaceSandbox {
    resolvePath(path: string): string;
    run(input: {
        signal?: AbortSignal;
        command: string;
    }): PromiseLike<{
        exitCode: number;
        stderr: string;
        stdout: string;
    }>;
}
/**
 * Resolves `path` (default: the workspace root) to a real path inside the real
 * workspace. Symlinks are followed before the check, so a link cannot escape.
 */
export declare function resolveInWorkspace(sandbox: WorkspaceSandbox, path: string | undefined, label: string, abortSignal?: AbortSignal): Promise<{
    readonly path: string;
    readonly workspace: string;
}>;
