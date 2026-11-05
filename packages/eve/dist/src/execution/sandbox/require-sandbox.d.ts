import type { SandboxSession } from "#public/definitions/sandbox.js";
/**
 * Resolves a model-supplied file path to an absolute sandbox path: a leading
 * `$HOME` through the sandbox's home, and a relative path from the workspace
 * root, where `bash` commands start.
 */
export declare function resolveAbsoluteFilePath(sandbox: SandboxSession, filePath: string): Promise<string>;
