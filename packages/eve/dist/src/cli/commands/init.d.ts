import { isCodingAgentLaunch } from "#cli/agent-detection.js";
import type { EveCliSetupFailureCode, EveCliSetupStep, EveCliSetupTerminalResult } from "#cli/telemetry/index.js";
import { detectInvokingPackageManager, detectPackageManager } from "#setup/package-manager.js";
import { runPackageManagerInstall, spawnPackageManager } from "#setup/primitives/index.js";
import { addAgentToProject } from "#setup/scaffold/create/add-to-project.js";
import { ensureChannel, scaffoldBaseProject } from "#setup/scaffold/index.js";
import { validateModelSlug } from "#setup/flows/model-source-change.js";
import { type InitCliLogger, type InitCommandOptions } from "./init-agent-workspace.js";
import { tryInitializeGit } from "./init-git.js";
import { hasInteractiveTerminal } from "./preconditions.js";
export type { InitCliLogger, InitCommandOptions } from "./init-agent-workspace.js";
export interface InitCommandDependencies {
    addAgentToProject: typeof addAgentToProject;
    detectInvokingPackageManager: typeof detectInvokingPackageManager;
    detectPackageManager: typeof detectPackageManager;
    ensureChannel: typeof ensureChannel;
    isCodingAgentLaunch: typeof isCodingAgentLaunch;
    now: () => number;
    runPackageManagerInstall: typeof runPackageManagerInstall;
    scaffoldBaseProject: typeof scaffoldBaseProject;
    hasInteractiveTerminal: typeof hasInteractiveTerminal;
    spawnPackageManager: typeof spawnPackageManager;
    tryInitializeGit: typeof tryInitializeGit;
    validateModelSlug: typeof validateModelSlug;
}
export declare const EVE_INIT_PACKAGE_SPEC_ENV = "EVE_INIT_PACKAGE_SPEC";
type InitTerminalTracker = (step: EveCliSetupStep, result: EveCliSetupTerminalResult, failureCode?: EveCliSetupFailureCode) => void;
export declare function runInitCommand(logger: InitCliLogger, parentDirectory: string, target: string | undefined, options: InitCommandOptions, dependencies?: InitCommandDependencies, trackStep?: (step: EveCliSetupStep) => void, trackTerminal?: InitTerminalTracker): Promise<void>;
