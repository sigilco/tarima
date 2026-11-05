import type { SandboxNetworkPolicy } from "./sandbox-network-policy.js";
/** Returns whether a value is a complete Git object SHA. */
export declare function isFullGitSha(value: string): boolean;
/** Returns whether a value can safely be used as a Git ref. */
export declare function isValidGitRef(value: string): boolean;
/** Builds the token-free HTTPS remote used by GitHub fetches. */
export declare function gitHubRemoteUrl(input: {
    readonly owner: string;
    readonly repo: string;
}): string;
/**
 * Brokers a GitHub installation token at the sandbox firewall without exposing
 * it to the process running git. codeload.github.com is required for redirects
 * from shallow fetches.
 */
export declare function gitHubGitBrokerNetworkPolicy(token: string): SandboxNetworkPolicy;
