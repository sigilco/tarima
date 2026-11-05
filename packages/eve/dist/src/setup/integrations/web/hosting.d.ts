import { resolveEveProjectContext } from "#internal/project-context.js";
import { detectPackageManager, type PackageManagerKind } from "#setup/package-manager.js";
import { pathExists, writeTextFile } from "#setup/scaffold/files.js";
export interface WebChatHostingDeps {
    detectPackageManager: typeof detectPackageManager;
    pathExists: typeof pathExists;
    readTextFile(path: string): Promise<string>;
    /** Defaults to a forced `rm`. */
    removeFile?(path: string): Promise<void>;
    resolveEveProjectContext: typeof resolveEveProjectContext;
    writeTextFile: typeof writeTextFile;
}
export declare const defaultWebChatHostingDeps: WebChatHostingDeps;
export declare function peerServiceVercelConfig(framework: "nextjs" | "tanstack-start", buildCommand: string): string;
export declare function runScriptCommand(packageManager: PackageManagerKind, script: string): string;
export interface WebChatProject {
    environmentRoot: string;
    agentAppRoot: string;
    /** Set for a workspace member so the chat app targets it by name. */
    agentName?: string;
}
export declare function resolveWebChatProject(appRoot: string, deps: WebChatHostingDeps): Promise<WebChatProject>;
export interface WebChatHostingInput {
    project: WebChatProject;
    webRoot: string;
    force?: boolean;
    /** Whether to write the default channel when it is absent (or forced). */
    writeChannel: boolean;
    /** The web app's framework config, e.g. `next.config.ts`. */
    hostConfig: {
        path: string;
        source: string;
        owned: readonly string[];
    };
    vercelServices: boolean;
    /** The installer's `vercel.ts`, followed by any it wrote in earlier releases. */
    vercelConfigs: readonly [string, ...string[]];
}
/**
 * Checks every file Web Chat hosting would overwrite or remove, then returns
 * the writer, so an authored file fails setup before anything is written.
 */
export declare function prepareWebChatHosting(input: WebChatHostingInput, deps: WebChatHostingDeps): Promise<() => Promise<void>>;
