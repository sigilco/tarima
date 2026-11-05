import type { SandboxSession } from "#shared/sandbox-session.js";
/**
 * Typed input accepted by {@link executeWriteFileOnSandbox}.
 */
export interface WriteFileInput {
    readonly content: string;
    readonly filePath: string;
}
/**
 * Structured result returned from {@link executeWriteFileOnSandbox}.
 */
export interface WriteFileResult {
    readonly existed: boolean;
    readonly path: string;
}
/**
 * Keeps `write_file`'s read record current after another tool in the session
 * rewrites a file, so that change is not reported as a stale read. `before`
 * and `after` are the file's text as `readTextFile` decodes it. The record
 * moves only when it matches `before`: a file the session never read stays
 * unread, and a change made since the last read still fails the next write.
 * Outside a session this does nothing.
 */
export declare function refreshReadFileStamp(filePath: string, before: string, after: string): void;
/**
 * Writes one text file to the sandbox with read-before-write
 * enforcement and stale-read detection for existing files.
 *
 * Used by the framework `write_file` tool and authored wrappers around its
 * exported definition.
 */
export declare function executeWriteFileOnSandbox(sandbox: SandboxSession, args: WriteFileInput): Promise<WriteFileResult>;
