import { type Asker } from "#setup/ask.js";
import { detectDeployment, type VercelProjectReference } from "#setup/project-resolution.js";
import type { Prompter } from "#setup/prompter.js";
import { getVercelAuthStatus } from "#setup/vercel-project.js";
import type { IntegrationSetupResult, SetupExternalAction } from "./types.js";
/** Inputs shared by every registry-owned integration setup flow. */
interface RunIntegrationSetupOptions {
    /** Selected agent project where authored files are changed. */
    appRoot: string;
    /** Project root for shared dependencies, Vercel links, and environment files. */
    projectRoot?: string;
    prompter: Prompter;
    /** Defaults to the interactive adapter; agent drivers inject an answer-backed asker. */
    asker?: Asker;
    signal?: AbortSignal;
    force?: boolean;
    beginExternalAction?: (input: {
        url: string;
        userCode?: string;
        message: string;
    }) => SetupExternalAction;
    resolveVercelProject?: SetupProjectResolver;
}
/** Effects shared by the built-in integration setup runner. */
type SetupProjectResolver = (integration: string) => Promise<VercelProjectReference>;
export interface IntegrationSetupRunnerDeps {
    detectDeployment: typeof detectDeployment;
    getVercelAuthStatus: typeof getVercelAuthStatus;
}
/** Runs one built-in integration setup flow selected by its registry setup name. */
export declare function runIntegrationSetup(kind: string, options: RunIntegrationSetupOptions, deps?: IntegrationSetupRunnerDeps): Promise<IntegrationSetupResult>;
export {};
