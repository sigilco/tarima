import { relative } from "node:path";
import { captureVercel, runVercelCaptureStdout } from "#setup/primitives/run-vercel.js";
import type { VercelProjectReference } from "#setup/project-resolution.js";
export declare const SELF_MODIFICATION_CONFIG_PATH = "agent/extensions/self-modification/extension.ts";
export declare const DEPLOYED_SELF_MODIFICATION_CONFIG_PATH = "agent/extensions/self-modification-remote/extension.ts";
export interface SelfModificationSetupValues {
    readonly branch: string;
    readonly channelNames: readonly string[];
    readonly connector: string;
    readonly directory: string;
    readonly repository: string;
}
export interface DetectedGitRepository {
    readonly branch?: string;
    readonly directory?: string;
    readonly owner?: string;
    readonly repo?: string;
    readonly remoteKind: "github" | "missing" | "other";
}
export interface SelfModificationSetupOperations {
    attachConnector(connector: string, project: VercelProjectReference): Promise<void>;
    detectChannelNames(): Promise<readonly string[]>;
    detectGitRepository(): Promise<DetectedGitRepository>;
    findOrCreateConnector(name: string, project: VercelProjectReference): Promise<string>;
    /** Reads the deployed mount at {@link DEPLOYED_SELF_MODIFICATION_CONFIG_PATH}. */
    readConfig(): Promise<string | undefined>;
    /** Reads the local mount at {@link SELF_MODIFICATION_CONFIG_PATH}. */
    readLocalConfig(): Promise<string | undefined>;
    /** Writes the deployed mount at {@link DEPLOYED_SELF_MODIFICATION_CONFIG_PATH}. */
    writeConfig(source: string): Promise<void>;
}
export interface SelfModificationSetupDependencies {
    captureVercel: typeof captureVercel;
    runVercelCaptureStdout: typeof runVercelCaptureStdout;
}
export declare function connectorName(owner: string, repo: string): string;
export declare function renderSelfModificationConfig(values?: SelfModificationSetupValues): string;
/** Distinguishes resumable generated source from authored source without evaluating it. */
export declare function classifySelfModificationConfig(source: string | undefined): "missing" | "local" | "generated" | "authored";
export declare function parseGitHubRemote(remote: string): {
    owner: string;
    repo: string;
} | undefined;
export declare function defaultSelfModificationSetupOperations(appRoot: string, deps?: SelfModificationSetupDependencies, projectRoot?: string): SelfModificationSetupOperations;
export declare function repositoryRelativeDirectory(repositoryRoot: string, appRoot: string, relativePath?: typeof relative): string;
export declare function repositoryPartError(value: string): string | undefined;
export declare function directoryError(value: string): string | undefined;
export declare function gitRefError(value: string): string | undefined;
