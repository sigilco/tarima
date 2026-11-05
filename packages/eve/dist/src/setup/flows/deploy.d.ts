import { inspectApplication } from "#services/inspect-application.js";
import { type DeployProjectDeps } from "../boxes/deploy-project.js";
import { type LinkProjectDeps } from "../boxes/link-project.js";
import { type ResolveProvisioningDeps } from "../boxes/resolve-provisioning.js";
import { detectDeployment } from "../project-resolution.js";
import type { Prompter } from "../prompter.js";
import { runInstallVercelCliFlow } from "./install-vercel-cli.js";
import { runLoginFlow } from "./login.js";
/** Injected for tests; defaults to the real detection and box effects. */
export interface DeployFlowDeps {
    detectDeployment: typeof detectDeployment;
    inspectApplication: typeof inspectApplication;
    runLoginFlow: typeof runLoginFlow;
    runInstallVercelCliFlow: typeof runInstallVercelCliFlow;
    resolveProvisioning?: ResolveProvisioningDeps;
    linkProject?: LinkProjectDeps;
    deployProject?: DeployProjectDeps;
}
export type DeployFlowResult = {
    kind: "deployed";
    productionUrl?: string;
} | {
    kind: "cancelled";
} | {
    kind: "local-model";
}
/** Unlinked directory in a non-interactive run: refused before any effect. */
 | {
    kind: "needs-link";
};
/**
 * Interactive deployment prepares CLI access before linking or deploying.
 * Noninteractive deployment never installs tools or starts browser login.
 */
export declare function runDeployFlow(input: {
    appRoot: string;
    prompter: Prompter;
    signal?: AbortSignal;
    traceSampling?: boolean;
    /** False when no TTY: an unlinked directory refuses instead of prompting. */
    interactive: boolean;
    deps?: Partial<DeployFlowDeps>;
}): Promise<DeployFlowResult>;
