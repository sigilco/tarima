import type { DockerCli } from "#execution/sandbox/bindings/docker-cli.js";
import type { SandboxNetworkPolicy } from "#shared/sandbox-network-policy.js";
/**
 * Rejects a policy Docker cannot enforce, so a restrictive one never runs
 * with open egress instead.
 */
export declare function assertDockerNetworkPolicy(policy: SandboxNetworkPolicy): asserts policy is "allow-all" | "deny-all";
/**
 * Applies a coarse-grained run-time network policy by attaching or
 * detaching the container's networks. Domain-level policies and
 * credential brokering require the firewall on the Vercel provider.
 */
export declare function setDockerNetworkPolicy(cli: DockerCli, containerName: string, policy: SandboxNetworkPolicy): Promise<void>;
