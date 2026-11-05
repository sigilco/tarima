import type { DockerSandboxEnvironmentOptions, DockerSandboxPullPolicy } from "#public/sandbox/docker-sandbox.js";
/**
 * Default base image for the Docker provider: eve's published sandbox
 * runtime image.
 */
export declare const DEFAULT_DOCKER_SANDBOX_IMAGE: string;
/**
 * Fully-defaulted Docker provider options consumed by the provider
 * implementation.
 */
export interface ResolvedDockerSandboxOptions {
    readonly env: Readonly<Record<string, string>>;
    readonly image: string;
    readonly pullPolicy: DockerSandboxPullPolicy;
}
/**
 * Applies defaults to `docker(opts)`.
 */
export declare function resolveDockerSandboxOptions(options?: DockerSandboxEnvironmentOptions): ResolvedDockerSandboxOptions;
export declare function createDockerSandboxOptionsHash(options: ResolvedDockerSandboxOptions): string;
