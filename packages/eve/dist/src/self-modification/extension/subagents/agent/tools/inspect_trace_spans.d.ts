import type { ResolvedSelfModificationConfig } from "../../../../config.js";
export declare function resolveInspectTraceSpansTool(config: ResolvedSelfModificationConfig): (import("eve/tools").ToolDefinition<Record<string, unknown>, {
    traceId: string;
    spans: ({
        spanId: string;
        found: boolean;
        availableFields?: undefined;
        fields?: undefined;
        rawPath?: undefined;
        truncated?: undefined;
    } | {
        spanId: string;
        found: boolean;
        availableFields: ("arguments" | "error" | "result")[];
        fields: Record<string, string>;
        rawPath: string;
        truncated: boolean;
    })[];
    truncated: boolean;
}> & {
    execute(input: Record<string, unknown>, ctx: import("eve/tools").ToolContext): Promise<{
        traceId: string;
        spans: ({
            spanId: string;
            found: boolean;
            availableFields?: undefined;
            fields?: undefined;
            rawPath?: undefined;
            truncated?: undefined;
        } | {
            spanId: string;
            found: boolean;
            availableFields: ("arguments" | "error" | "result")[];
            fields: Record<string, string>;
            rawPath: string;
            truncated: boolean;
        })[];
        truncated: boolean;
    }>;
}) | null;
declare const _default: import("eve/tools").DynamicSentinel<(import("eve/tools").ToolDefinition<Record<string, unknown>, {
    traceId: string;
    spans: ({
        spanId: string;
        found: boolean;
        availableFields?: undefined;
        fields?: undefined;
        rawPath?: undefined;
        truncated?: undefined;
    } | {
        spanId: string;
        found: boolean;
        availableFields: ("arguments" | "error" | "result")[];
        fields: Record<string, string>;
        rawPath: string;
        truncated: boolean;
    })[];
    truncated: boolean;
}> & {
    execute(input: Record<string, unknown>, ctx: import("eve/tools").ToolContext): Promise<{
        traceId: string;
        spans: ({
            spanId: string;
            found: boolean;
            availableFields?: undefined;
            fields?: undefined;
            rawPath?: undefined;
            truncated?: undefined;
        } | {
            spanId: string;
            found: boolean;
            availableFields: ("arguments" | "error" | "result")[];
            fields: Record<string, string>;
            rawPath: string;
            truncated: boolean;
        })[];
        truncated: boolean;
    }>;
}) | null, import("eve/tools").DynamicContext>;
export default _default;
