import { type LocalTraceSummary } from "#tracing/local/trace-summary.js";
import type { ResolvedSelfModificationConfig } from "../../../../config.js";
export declare function resolveSearchTracesTool(config: ResolvedSelfModificationConfig): (import("eve/tools").ToolDefinition<Record<string, unknown>, {
    conversationId: string;
    coverage: {
        complete: boolean;
        considered: number;
        matched: number;
        stored: number;
        warning?: string;
    };
    matches: readonly LocalTraceSummary[];
    truncated: boolean;
}> & {
    execute(input: Record<string, unknown>, ctx: import("eve/tools").ToolContext): Promise<{
        conversationId: string;
        coverage: {
            complete: boolean;
            considered: number;
            matched: number;
            stored: number;
            warning?: string;
        };
        matches: readonly LocalTraceSummary[];
        truncated: boolean;
    }>;
}) | null;
declare const _default: import("eve/tools").DynamicSentinel<(import("eve/tools").ToolDefinition<Record<string, unknown>, {
    conversationId: string;
    coverage: {
        complete: boolean;
        considered: number;
        matched: number;
        stored: number;
        warning?: string;
    };
    matches: readonly LocalTraceSummary[];
    truncated: boolean;
}> & {
    execute(input: Record<string, unknown>, ctx: import("eve/tools").ToolContext): Promise<{
        conversationId: string;
        coverage: {
            complete: boolean;
            considered: number;
            matched: number;
            stored: number;
            warning?: string;
        };
        matches: readonly LocalTraceSummary[];
        truncated: boolean;
    }>;
}) | null, import("eve/tools").DynamicContext>;
export default _default;
