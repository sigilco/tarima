import { type DockerCli } from "#execution/sandbox/bindings/docker-cli.js";
import { type DockerSandboxExtensions } from "#execution/sandbox/bindings/docker-connection.js";
import type { DockerSandboxEnvironmentOptions, DockerSandboxRuntimeOptions } from "#public/sandbox/docker-sandbox.js";
import { type SandboxProviderImplementation } from "#public/sandbox/provider.js";
export { DOCKER_TEMPLATE_IMAGE_REPOSITORY, pruneDockerSandboxTemplates, } from "#execution/sandbox/bindings/docker-templates.js";
/**
 * Stable provider name used for prepared-artifact storage and provider identity.
 */
export declare const DOCKER_PROVIDER_NAME = "docker";
type DockerSandboxPreparedArtifact = {
    readonly imageReference: string;
};
type DockerSandboxSessionState = {
    readonly containerName: string;
    readonly version: 2;
};
/** Environment options the provider receives: eve runs `prepare` itself. */
export type DockerSandboxProviderOptions = Omit<DockerSandboxEnvironmentOptions, "prepare">;
/**
 * Creates the Docker sandbox provider.
 *
 * Two-phase lifecycle mapped onto Docker primitives:
 *
 * - `prepare` runs the base image, applies base setup, lets eve seed the
 *   workspace and skills and run the authored preparation, then
 *   `docker commit`s the container into a reusable template image.
 * - `start` starts (or restarts) one long-lived container per session
 *   from the template image. The container's filesystem carries session
 *   state across reconnects, so stopping only stops the container and the
 *   next `start` or `resume` restarts it with state intact.
 */
export declare function createDockerSandboxProvider(createOptions: DockerSandboxProviderOptions, dockerCli?: DockerCli): SandboxProviderImplementation<DockerSandboxRuntimeOptions, DockerSandboxPreparedArtifact, DockerSandboxSessionState, DockerSandboxExtensions>;
