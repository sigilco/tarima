/**
 * Detects a built eve server that reported a failed start in `output`.
 *
 * srvx only logs a failed bind and sets `process.exitCode`, so the process can
 * stay alive without serving anything. Callers must treat this output as fatal
 * and stop the process themselves.
 */
export declare function readBuiltServerStartFailure(output: string, listen: {
    readonly host: string;
    readonly port: number | string;
    readonly retryHint: string;
}): Error | undefined;
