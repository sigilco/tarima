import type { VercelProjectReference } from "#setup/project-resolution.js";
import { runVercel, runVercelCaptureStdout } from "#setup/primitives/run-vercel.js";
import { writeTextFile } from "#setup/scaffold/files.js";
import { provisionTeamsConnector } from "./connect.js";
import { type SetupApplyContext, type SetupPrepareContext } from "../types.js";
export interface TeamsSetupDeps {
    provisionConnector: typeof provisionTeamsConnector;
    runVercel: typeof runVercel;
    runVercelCaptureStdout: typeof runVercelCaptureStdout;
    writeTextFile: typeof writeTextFile;
}
interface TeamsSetupPlan {
    name: string;
    project: VercelProjectReference;
}
export declare function prepareTeamsSetup(context: SetupPrepareContext): Promise<TeamsSetupPlan>;
export declare function applyTeamsSetup(plan: TeamsSetupPlan, context: SetupApplyContext, deps?: TeamsSetupDeps): Promise<{
    facts: never[];
    deploymentRequired: true;
}>;
export declare const TEAMS_SETUP: import("../types.js").SetupIntegration;
export {};
