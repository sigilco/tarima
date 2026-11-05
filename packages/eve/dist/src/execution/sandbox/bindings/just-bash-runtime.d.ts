import type { JustBashSandboxCreateOptions } from "#public/sandbox/just-bash-sandbox.js";
import { type SandboxConnection } from "#public/sandbox/provider.js";
type JustBashModule = typeof import("just-bash");
/** One just-bash interpreter over a session or template root. The root's files outlive it. */
export interface BashSandbox extends SandboxConnection {
    /** Records the interpreter's environment, so sessions created from this template start with it. */
    captureState(): Promise<void>;
}
/**
 * Loads `just-bash` for template preparation, installing it into the project
 * when it is missing during `eve dev` (unless `autoInstall` is false).
 */
export declare function installJustBashModule(input: {
    readonly appRoot: string;
    readonly autoInstall: boolean;
}): Promise<JustBashModule>;
/** Loads `just-bash` for a session without installing it. */
export declare function importJustBashModule(appRoot: string): Promise<JustBashModule>;
export declare function createBashSandbox(input: {
    readonly experimental?: JustBashSandboxCreateOptions["experimental"];
    readonly justBash: JustBashModule;
    resolveProjectPath(path: string): string;
    readonly rootPath: string;
    readonly storagePath: string;
}): Promise<BashSandbox>;
export {};
