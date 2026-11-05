import type { DockerCli } from "#execution/sandbox/bindings/docker-cli.js";
import type { SandboxProviderFiles } from "#shared/sandbox-provider.js";
export interface SandboxDockerfile {
    readonly contextPath: string;
    readonly contentHash: string;
    readonly path: string;
}
export declare function materializeSandboxDockerfile(input: {
    readonly files: SandboxProviderFiles;
    readonly storagePath: string;
}): Promise<SandboxDockerfile | undefined>;
export declare function dockerfileImageReference(input: {
    readonly dockerfile: SandboxDockerfile;
    readonly templateKey: string;
}): string;
export declare function buildSandboxDockerfile(input: {
    readonly cli: DockerCli;
    readonly dockerfile: SandboxDockerfile;
    readonly imageReference: string;
}): Promise<void>;
