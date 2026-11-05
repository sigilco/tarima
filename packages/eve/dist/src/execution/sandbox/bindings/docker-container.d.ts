import type { DockerCli } from "#execution/sandbox/bindings/docker-cli.js";
import type { ResolvedDockerSandboxOptions } from "#execution/sandbox/bindings/docker-options.js";
import type { DockerSandboxNetworkPolicy } from "#public/sandbox/docker-sandbox.js";
export declare const DOCKER_SANDBOX_LABEL = "eve.sandbox";
/** Where a template build container mounts the read-only workspace and skill resources. */
export declare const DOCKER_RESOURCES_MOUNT_PATH = "/eve/resources";
export declare function startDockerContainer(input: {
    readonly cli: DockerCli;
    readonly containerName: string;
    readonly image: string;
    readonly initialNetworkPolicy: DockerSandboxNetworkPolicy;
    readonly options: ResolvedDockerSandboxOptions;
    readonly resourcesPath?: string;
    readonly role: "session" | "template-build";
    readonly tags?: Readonly<Record<string, string>>;
}): Promise<void>;
export declare function runDockerBaseSetup(cli: DockerCli, containerName: string): Promise<void>;
export declare function stopDockerContainerIfRunning(cli: DockerCli, containerName: string): Promise<void>;
