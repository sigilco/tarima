import { runVercelEnvPull } from "#setup/run-vercel-link.js";
import { runVercel } from "#setup/primitives/index.js";
import { readProjectLink } from "#setup/project-resolution.js";
import { resolveProjectByNameOrId, resolveTeam } from "#setup/vercel-project.js";
import type { Prompter } from "#setup/prompter.js";
interface VercelNonInteractiveLogger {
    error(message: string): void;
    log(message: string): void;
}
export interface VercelProjectCliOptions {
    nonInteractive?: boolean;
    project?: string;
    team?: string;
}
export interface NonInteractiveLinkDependencies {
    runVercel: typeof runVercel;
    runVercelEnvPull: typeof runVercelEnvPull;
    readProjectLink: typeof readProjectLink;
    resolveTeam: typeof resolveTeam;
    resolveProjectByNameOrId: typeof resolveProjectByNameOrId;
}
export declare function isNonInteractiveProjectCommand(options: VercelProjectCliOptions): boolean;
/**
 * Links a named Vercel project and refreshes its local environment without a
 * prompt. Callers validate `appRoot` first, since a workspace root is not an
 * eve project by itself.
 */
export declare function runNonInteractiveLink(input: {
    logger: VercelNonInteractiveLogger;
    appRoot: string;
    options: VercelProjectCliOptions & {
        traceSampling?: boolean;
    };
    prompter: Pick<Prompter, "log">;
    dependencies?: NonInteractiveLinkDependencies;
}): Promise<boolean>;
export {};
