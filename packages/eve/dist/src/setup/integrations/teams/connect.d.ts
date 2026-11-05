import { type ChannelSetupLog } from "#setup/cli/index.js";
import type { VercelProjectReference } from "#setup/project-resolution.js";
import { runVercel, runVercelCaptureStdout } from "#setup/primitives/run-vercel.js";
interface TeamsConnectorRef {
    id: string;
    uid: string;
}
interface ProvisionTeamsConnectorDeps {
    runVercel: typeof runVercel;
    runVercelCaptureStdout: typeof runVercelCaptureStdout;
}
export declare function parseCreatedTeamsConnector(stdout: string): TeamsConnectorRef | undefined;
/** Creates and installs a Teams app through the Vercel Connect CLI. */
export declare function provisionTeamsConnector(input: {
    name: string;
    log: ChannelSetupLog;
    project: VercelProjectReference;
    projectRoot: string;
    signal?: AbortSignal;
    deps?: ProvisionTeamsConnectorDeps;
}): Promise<TeamsConnectorRef>;
export {};
