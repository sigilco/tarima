import type { SandboxSession } from "eve/sandbox";
import type { SandboxNetworkPolicy } from "#shared/sandbox-network-policy.js";
type NetworkPolicySandboxSession = SandboxSession & {
    setNetworkPolicy(policy: SandboxNetworkPolicy): Promise<void>;
};
type CommandSandbox = Pick<SandboxSession, "run">;
export declare function withBrokeredGitHubCredential<T>(sandbox: Pick<NetworkPolicySandboxSession, "setNetworkPolicy">, token: string, operation: () => Promise<T>): Promise<T>;
export declare function gitOutput(sandbox: CommandSandbox, command: string, trim?: boolean): Promise<string>;
export declare function runGitCommand(sandbox: CommandSandbox, command: string): Promise<void>;
export {};
