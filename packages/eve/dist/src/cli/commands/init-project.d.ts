import { type NodeEngineOverride } from "#setup/node-engine.js";
import type { PackageManagerKind } from "#setup/package-manager.js";
import type { WorkspaceRootMutation } from "#setup/scaffold/workspace-root.js";
import type { GitInitResult } from "./init-git.js";
import type { InitCliLogger } from "./init-agent-workspace.js";
import type { InitFailurePolicy } from "./init-recovery.js";
export type PreparedInitProject = {
    configurationFilesChanged: string[];
    dependenciesAdded: string[];
    failurePolicy: "preserve";
    filesWritten: string[];
    kind: "added";
    nodeEngineOverride?: NodeEngineOverride;
    packageManager: PackageManagerKind;
    projectPath: string;
} | {
    failurePolicy: InitFailurePolicy;
    kind: "created";
    packageManager: PackageManagerKind;
    preservedTargetEntries: readonly string[];
    projectPath: string;
    retryCommand: string;
    workspaceMember: boolean;
    workspaceRootMutations: WorkspaceRootMutation[];
};
export type InitResult = {
    elapsedMs: number;
    agentLaunched: boolean;
    packageManager: PackageManagerKind;
    projectPath: string;
} & ({
    configurationFilesChanged: string[];
    dependenciesAdded: string[];
    filesWritten: string[];
    kind: "added";
    nodeEngineOverride?: NodeEngineOverride;
} | {
    gitResult: GitInitResult;
    kind: "created";
    workspaceRootMutations: WorkspaceRootMutation[];
});
export declare function reportExistingProjectChanges(logger: InitCliLogger, project: Extract<PreparedInitProject, {
    kind: "added";
}>): void;
