export { createDockerSandboxProvider, DOCKER_PROVIDER_NAME, pruneDockerSandboxTemplates, } from "#execution/sandbox/bindings/docker.js";
export { isLinuxDockerDaemonAvailableSync } from "#execution/sandbox/bindings/docker-cli.js";
export { createJustBashSandboxProvider, JUST_BASH_PROVIDER_NAME, pruneJustBashSandboxTemplates, } from "#execution/sandbox/bindings/just-bash.js";
export { stopDevelopmentSandboxResources } from "#execution/sandbox/development-cleanup.js";
/**
 * Removes stale local sandbox template state for one application
 * across every local engine: just-bash template directories and Docker
 * template images (tracked through per-app marker files). Docker pruning
 * silently skips when no Docker runtime is reachable so docker-less setups
 * stay quiet.
 */
export declare function pruneLocalSandboxTemplates(input: {
    readonly appRoot: string;
    readonly now?: number;
    readonly recentWindowMs?: number;
    readonly retainCount?: number;
}): Promise<void>;
/**
 * Starts best-effort cleanup for stale local sandbox templates without
 * delaying `eve dev` startup or rebuild handling.
 */
export declare function pruneLocalSandboxTemplatesInBackground(appRoot: string): void;
