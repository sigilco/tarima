import { type ToolStubPlayback } from "#context/providers/tool-stubs-key.js";
export declare const toolStubProvider: {
    key: import("../key.ts").ContextKey<ToolStubPlayback>;
    create(ctx: import("../container.ts").ContextContainer): {
        value: {
            call: (call: import("../../tool-stubs/types.ts").StubCall) => Promise<import("../../tool-stubs/types.ts").StubResult>;
            fail: (callId: string, error: string) => Promise<void>;
        };
    } | undefined;
};
