import type { ChannelSetupLog } from "#setup/cli/index.js";
import type { VercelProjectReference } from "#setup/project-resolution.js";
import { runVercel, runVercelCaptureStdout } from "#setup/primitives/run-vercel.js";
interface LinqConnectorRef {
    id: string;
    uid: string;
    phoneNumber?: string;
}
interface ProvisionLinqConnectorDeps {
    runVercel: typeof runVercel;
    runVercelCaptureStdout: typeof runVercelCaptureStdout;
}
/** Credentials for a connector backed by an existing Linq account. */
export interface LinqExistingAccountCredentials {
    apiToken: string;
    phoneNumbers: string[];
}
/** Parses Vercel Connect JSON for an app-scoped Linq connector. */
export declare function parseCreatedLinqConnector(stdout: string): LinqConnectorRef | undefined;
/** Creates a managed Linq connector and routes verified events to eve. */
export declare function provisionLinqConnector(input: {
    /** When omitted, Connect opens Linq's managed browser flow to provision a line. */
    existingAccount?: LinqExistingAccountCredentials;
    log: ChannelSetupLog;
    project: VercelProjectReference;
    projectRoot: string;
    slug: string;
    signal?: AbortSignal;
    deps?: ProvisionLinqConnectorDeps;
}): Promise<LinqConnectorRef>;
export {};
