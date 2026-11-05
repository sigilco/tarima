import type { MappingContext, OutputMapping } from "#compiled/@vercel/agent-runs/index.js";
export declare function eveOutputMapping(options?: {
    readonly resolve: (span: MappingContext) => {
        readonly traceSessionId?: string;
        readonly platform: "vercel" | "other";
    };
}): OutputMapping;
