import type { SandboxProcess } from "#shared/sandbox-session.js";
type OutputName = "stderr" | "stdout";
interface MultiplexedCommand<Log extends {
    readonly data: string;
}> {
    kill(): PromiseLike<void>;
    logs(options: {
        readonly signal?: AbortSignal;
    }): AsyncIterable<Log>;
    wait(options: {
        readonly signal?: AbortSignal;
    }): PromiseLike<{
        readonly exitCode: number;
    }>;
}
interface StdinCommand {
    closeStdin(options: {
        readonly abortSignal?: AbortSignal;
    }): PromiseLike<void>;
    writeStdin(data: Uint8Array, options: {
        readonly abortSignal?: AbortSignal;
    }): PromiseLike<void>;
}
/**
 * Adapts a detached command with one tagged log iterator to a sandbox process
 * with independent stdout and stderr streams. Aborting `abortSignal` kills the
 * command and rejects `wait()` and both streams. `stdin`, when given, backs
 * the process's writable `stdin` stream.
 */
export declare function adaptMultiplexedCommandToSandboxProcess<Log extends {
    readonly data: string;
}>(input: {
    readonly abortSignal?: AbortSignal;
    readonly command: MultiplexedCommand<Log>;
    readonly getOutput: (log: Log) => OutputName;
    readonly stdin?: StdinCommand;
}): SandboxProcess;
export {};
