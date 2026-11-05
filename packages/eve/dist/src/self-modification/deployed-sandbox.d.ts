import { type SandboxSelector } from "#shared/sandbox-environment.js";
import { type DeployedSelfModificationConfig } from "./remote/config.js";
/**
 * Defines the deployed child's sandbox. During `eve dev` the deployed child is never
 * offered, so its sandbox binds an inert environment. Other builds bind a Vercel
 * environment, whose empty preparation is a no-op, so they compile on any host;
 * the Vercel requirement is enforced when a deployed child opens its sandbox.
 */
export declare function defineDeployedSelfModificationSandbox(config: DeployedSelfModificationConfig, isDeployedOnVercel?: () => boolean): SandboxSelector;
