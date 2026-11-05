import type { SandboxSession } from "#shared/sandbox-session.js";
/** How long a `bash` call waits by default before it leaves the command running in the background. */
export declare const BASH_YIELD_SECONDS = 60;
/**
 * The longest a `bash` call waits. A hosted step runs a model call and its tool
 * calls in one Vercel function, which Hobby plans stop at 300 seconds, and a
 * function timeout loses the call's result, so the cap leaves room for the
 * model call, including its retries and long generations.
 */
export declare const BASH_MAX_YIELD_SECONDS = 120;
/**
 * Typed input accepted by {@link executeBashOnSandbox}.
 */
export interface BashInput {
    readonly command: string;
    /**
     * Seconds to wait before leaving the command running in the background.
     * Defaults to {@link BASH_YIELD_SECONDS}, also for non-finite values;
     * clamped to 1 through {@link BASH_MAX_YIELD_SECONDS}.
     */
    readonly timeout?: number;
}
/**
 * Per-call options for {@link executeBashOnSandbox}.
 */
export interface BashExecutionOptions {
    /**
     * Stops the command when aborted before the call returns. A command
     * already returned as `running` keeps running.
     */
    readonly abortSignal?: AbortSignal;
}
interface BashStreams {
    readonly stderr: string;
    readonly stdout: string;
    /** True when stdout or stderr was shortened to fit within output limits. */
    readonly truncated: boolean;
}
/**
 * Structured result returned from {@link executeBashOnSandbox}: the command
 * finished, or it is still running in the background.
 */
type BashResult = (BashStreams & {
    readonly status: "completed";
    readonly exitCode: number;
}) | (BashStreams & {
    readonly status: "running";
    readonly pid: number;
    readonly outputDirectory: string;
    readonly message: string;
});
/**
 * Executes one shell command inside the agent's sandbox.
 *
 * A command that finishes within the wait, {@link BASH_YIELD_SECONDS} unless
 * `args.timeout` says otherwise, returns its exit code and output. A slower
 * command keeps running in the sandbox as its own
 * process group, writing to files the model reads with later commands, and
 * the call returns its output so far with `status: "running"`. Sandboxes that
 * cannot run background processes, such as `just-bash`, run every command to
 * completion.
 *
 * Both stdout and stderr are tail-truncated to keep the end of the output
 * (where errors and final results typically appear) within the shared
 * output limits. A truncated stream's note names the file with its full
 * output when the sandbox kept it.
 */
export declare function executeBashOnSandbox(sandbox: SandboxSession, args: BashInput, options?: BashExecutionOptions): Promise<BashResult>;
export {};
