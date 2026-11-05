import type { SessionContext } from "#context/session-context.js";
import type { ToolExecuteOptions } from "#tools/definition.js";
/** Base context shared by tool executors. */
type BaseToolContext = SessionContext & {
    readonly abortSignal: AbortSignal;
    readonly callId: string;
    readonly toolName: string;
};
/** Builds the base context for one tool execution. */
export declare function buildBaseToolContext(input: {
    readonly options: Pick<ToolExecuteOptions, "abortSignal" | "toolCallId">;
    readonly toolName: string;
}): BaseToolContext;
export {};
