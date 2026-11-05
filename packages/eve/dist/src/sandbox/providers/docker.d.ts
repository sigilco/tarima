import type { DockerCli } from "#execution/sandbox/bindings/docker-cli.js";
import type { DockerSandboxEnvironmentOptions, DockerSandboxRuntimeOptions, DockerSandboxSession } from "#public/sandbox/docker-sandbox.js";
import { type SandboxProvider } from "#public/sandbox/provider.js";
import type { SandboxEnvironment } from "#shared/sandbox-environment.js";
export type { DockerSandboxEnvironmentOptions, DockerSandboxRuntimeOptions, } from "#public/sandbox/docker-sandbox.js";
type DockerfileEnvironmentInput = Omit<DockerSandboxEnvironmentOptions, "image">;
/** Defines the Docker provider over `dockerCli`, the real `docker` CLI unless tests inject one. */
export declare function defineDockerSandboxProvider(dockerCli?: DockerCli): SandboxProvider<DockerSandboxEnvironmentOptions, DockerSandboxRuntimeOptions, DockerSandboxSession>;
export declare const DockerSandbox: {
    name: string;
    environment(options?: Readonly<DockerSandboxEnvironmentOptions> | undefined): SandboxEnvironment<DockerSandboxRuntimeOptions, DockerSandboxSession>;
    dockerfile(options?: DockerfileEnvironmentInput): SandboxEnvironment<DockerSandboxRuntimeOptions, DockerSandboxSession>;
    image(reference: string, options?: DockerfileEnvironmentInput): SandboxEnvironment<DockerSandboxRuntimeOptions, DockerSandboxSession>;
};
