export declare const MODEL_CONNECTION_ENV = "EVE_MODEL_CONNECTION";
export declare const MODEL_HELPERS: {
    readonly chatgpt: {
        readonly module: "eve/models/openai";
        readonly prefix: "chatgpt/";
        readonly defaultModel: "gpt-6-luna-fast";
        readonly provider: "codex";
    };
    readonly openai: {
        readonly module: "eve/models/openai";
        readonly prefix: "openai-api/";
        readonly defaultModel: "gpt-6-luna-fast";
        readonly provider: "openai";
    };
    readonly anthropic: {
        readonly module: "eve/models/anthropic";
        readonly prefix: "anthropic-api/";
        readonly defaultModel: "claude-sonnet-5";
        readonly provider: "anthropic";
    };
};
export type ModelHelper = keyof typeof MODEL_HELPERS;
export declare function parseModelHelper(selection: string): {
    helper: ModelHelper;
    id: string;
} | undefined;
