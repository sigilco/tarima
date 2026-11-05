import type { LocalTrace } from "#tracing/local/trace-reader.js";
interface CliTraceLogger {
    error(message: string): void;
    log(message: string): void;
}
/**
 * Resolves an exact trace/conversation id or an unambiguous prefix. One
 * conversation ID can match several traces, since each turn is separate.
 */
export declare function resolveLocalTraces(traces: readonly LocalTrace[], reference: string): readonly LocalTrace[];
export declare function runTraceListCommand(logger: CliTraceLogger, appRoot: string, options?: {
    readonly json?: boolean;
}): Promise<void>;
export declare function runTraceShowCommand(logger: CliTraceLogger, appRoot: string, reference?: string, options?: {
    readonly json?: boolean;
    readonly verbose?: boolean;
}): Promise<void>;
export {};
