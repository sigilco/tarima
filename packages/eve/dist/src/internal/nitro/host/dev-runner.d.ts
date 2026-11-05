import { NodeWorkerEnvRunner } from "#compiled/env-runner/index.js";
export interface EveDevRunnerInput {
    readonly entry: string;
    readonly name: string;
    readonly workerData: Readonly<Record<string, unknown>>;
}
/**
 * Runs a Nitro development entry in a worker thread. `close()` without a
 * cause shuts down gracefully, so admitted requests settle and Nitro's close
 * hooks run; with a cause it stops at once.
 */
export declare class EveDevRunner extends NodeWorkerEnvRunner {
    #private;
    /** Settles once the worker thread is gone, so its host's files can go too. */
    readonly terminated: Promise<void>;
    constructor(input: EveDevRunnerInput);
    close(cause?: unknown): Promise<void>;
    shutdown(timeout?: number): Promise<void>;
}
