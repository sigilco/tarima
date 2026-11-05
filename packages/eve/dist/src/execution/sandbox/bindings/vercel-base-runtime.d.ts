import type { VercelSandboxCreateParams } from "#execution/sandbox/bindings/vercel-create-sdk.js";
import type { VercelCreateOptions, VercelSandbox } from "#execution/sandbox/bindings/vercel-sdk-types.js";
import type { SandboxNetworkPolicy } from "#shared/sandbox-network-policy.js";
/**
 * Prepares a fresh Vercel sandbox for use by the framework.
 */
export declare function ensureVercelSandboxBaseRuntime(sandbox: VercelSandbox): Promise<void>;
export declare function applyInitialVercelNetworkPolicy(sandbox: VercelSandbox, networkPolicy: VercelCreateOptions["networkPolicy"]): Promise<void>;
export declare function withBaseSetupNetworkPolicy(createOptions: VercelSandboxCreateParams): VercelSandboxCreateParams;
export declare function createVercelNetworkPolicySetter(sandbox: VercelSandbox): (policy: SandboxNetworkPolicy) => Promise<void>;
/** eve's policy is the SDK's shape with readonly members, and the SDK never mutates it. */
export declare function toVercelNetworkPolicy(policy: SandboxNetworkPolicy): NonNullable<VercelCreateOptions["networkPolicy"]>;
