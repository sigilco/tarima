import type { AgentReasoningDefinition } from "#shared/agent-definition.js";
import type { WorkspaceRootMutation } from "#setup/scaffold/workspace-root.js";
import { validateModelSlug } from "#setup/flows/model-source-change.js";
export interface InitCommandOptions {
    agents?: readonly string[];
    channelWebNextjs?: boolean;
    model?: string;
    reasoning?: AgentReasoningDefinition;
    /** Do not start development after initialization. */
    nonInteractive?: boolean;
}
export interface InitCliLogger {
    error(message: string): void;
    log(message: string): void;
}
export declare function formatWorkspaceRootMutationWarning(mutation: WorkspaceRootMutation): string;
export declare function convertScaffoldToAgentWorkspace(projectRoot: string, names: readonly string[], options: InitCommandOptions): Promise<void>;
export declare function addAgentsToWorkspace(logger: InitCliLogger, workspaceRoot: string, target: string | undefined, options: InitCommandOptions, validateModel?: typeof validateModelSlug): Promise<boolean>;
