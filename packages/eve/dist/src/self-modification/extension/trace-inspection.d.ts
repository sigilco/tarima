import type { ToolContext } from "eve/tools";
import { type LocalTraceSpan } from "#tracing/local/trace-reader.js";
export interface LocalTraceSpanSource {
    readonly segmentFile: string;
    readonly span: LocalTraceSpan;
}
export declare const TRACE_ID: RegExp;
export declare const SPAN_ID: RegExp;
export declare function readTraceSources(traceId: string, ctx: Pick<ToolContext, "abortSignal" | "getSandbox">): Promise<LocalTraceSpanSource[]>;
export declare function boundedText(value: string, maximum: number): string;
export declare function detailFields(source: LocalTraceSpanSource): {
    readonly arguments: unknown;
    readonly error: string | undefined;
    readonly result: unknown;
};
