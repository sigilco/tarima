import type { DockerCli } from "#execution/sandbox/bindings/docker-cli.js";
import type { DockerSandboxSession } from "#public/sandbox/docker.js";
import type { SandboxConnection } from "#public/sandbox/provider.js";
export type DockerSandboxExtensions = Pick<DockerSandboxSession, "setNetworkPolicy">;
/**
 * A connection bound to one container's identity rather than its name, so a
 * stale connection's commands, file operations, network policy changes, and
 * stop never reach a later container that reuses the session's name.
 * Deletion is the exception: `onSessionEnd` removes by session name, because
 * it is the single deletion path and must work without an open connection.
 */
export declare function createDockerConnection(input: {
    readonly cli: DockerCli;
    readonly containerIdentity: string;
}): SandboxConnection<DockerSandboxExtensions>;
