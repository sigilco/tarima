import type { ToolExecuteOptions } from "#tools/definition.js";
/** Tool inputs and approvals have already been checked before a stub can replace execution. */
export declare function executeWithToolStub(tool: string, input: unknown, options: ToolExecuteOptions, execute: () => unknown): unknown;
/** Record errors converting stub responses so eval verification can detect them. */
export declare function recordToolStubFailure(tool: string, callId: string | undefined, turnId?: string): Promise<void>;
/** Record stub failures even when the caller recovers with fallback output. */
export declare function observeToolOutput<T>(tool: string, calls: readonly {
    readonly callId: string;
    readonly turnId?: string;
}[], project: () => T | Promise<T>, recover?: (error: unknown) => T): Promise<T>;
