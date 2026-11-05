import type { JustBashSandboxCreateOptions } from "#public/sandbox/just-bash-sandbox.js";
import { type SandboxProviderImplementation } from "#public/sandbox/provider.js";
export declare const JUST_BASH_PROVIDER_NAME = "just-bash";
type JustBashPreparedArtifact = {
    readonly templateKey: string;
};
type JustBashSessionState = {
    readonly rootPath: string;
    readonly version: 2;
};
export declare function createJustBashSandboxProvider(options?: JustBashSandboxCreateOptions): SandboxProviderImplementation<undefined, JustBashPreparedArtifact, JustBashSessionState, {}>;
export declare function pruneJustBashSandboxTemplates(input: {
    readonly appRoot: string;
    readonly now?: number;
    readonly recentWindowMs?: number;
    readonly retainCount?: number;
}): Promise<void>;
export {};
