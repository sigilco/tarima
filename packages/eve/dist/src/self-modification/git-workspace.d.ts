import type { SandboxSession } from "eve/sandbox";
import type { SandboxNetworkPolicy } from "#shared/sandbox-network-policy.js";
type NetworkPolicySandboxSession = SandboxSession & {
    setNetworkPolicy(policy: SandboxNetworkPolicy): Promise<void>;
};
import type { GitHubRepository } from "./remote/config.js";
export declare const REPOSITORY_PATH = "/workspace/repository";
export interface PreparedSelfModificationWorkspace {
    readonly baseSha: string;
    readonly directory: string;
    readonly repository: GitHubRepository;
    readonly repositoryPath: string;
    readonly targetBranch: string;
}
type CheckoutSandbox = Pick<NetworkPolicySandboxSession, "run" | "setNetworkPolicy">;
/** Prepares a token-free remote and immutable target-branch checkout for one child session. */
export declare function prepareSelfModificationWorkspace(input: {
    readonly directory: string;
    readonly repository: GitHubRepository;
    readonly sandbox: CheckoutSandbox;
    readonly targetBranch: string;
    readonly token: string;
}): Promise<PreparedSelfModificationWorkspace>;
/** Reconstructs trusted workspace metadata after the session checkout preflight. */
export declare function readPreparedSelfModificationWorkspace(input: {
    readonly directory: string;
    readonly repository: GitHubRepository;
    readonly sandbox: Pick<SandboxSession, "run">;
    readonly targetBranch: string;
}): Promise<PreparedSelfModificationWorkspace>;
export {};
