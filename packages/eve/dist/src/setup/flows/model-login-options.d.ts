import type { ModelConnectionSelection } from "#shared/model-connection.js";
export declare const LOGIN_CONNECTION_OPTIONS: readonly [{
    readonly command: "vercel";
    readonly commandOrder: 0;
    readonly value: "vercel";
    readonly label: "Vercel Account";
}, {
    readonly command: "vercel-api-key";
    readonly commandOrder: 2;
    readonly value: "ai-gateway-key";
    readonly label: "Vercel AI Gateway API Key";
}, {
    readonly command: "chatgpt";
    readonly commandOrder: 1;
    readonly value: "chatgpt";
    readonly label: "ChatGPT Subscription";
}, {
    readonly command: "openai-api-key";
    readonly commandOrder: 3;
    readonly value: "openai";
    readonly label: "OpenAI API Key";
}, {
    readonly command: "anthropic-api-key";
    readonly commandOrder: 4;
    readonly value: "anthropic";
    readonly label: "Anthropic API Key";
}];
export declare const CONNECTION_OPTIONS: {
    value: "ai-gateway-key" | "anthropic" | "chatgpt" | "openai" | "vercel";
    label: "Anthropic API Key" | "ChatGPT Subscription" | "OpenAI API Key" | "Vercel AI Gateway API Key" | "Vercel Account";
}[];
export declare const LOGIN_CONNECTION_COMMAND_OPTIONS: ({
    readonly command: "vercel";
    readonly commandOrder: 0;
    readonly value: "vercel";
    readonly label: "Vercel Account";
} | {
    readonly command: "vercel-api-key";
    readonly commandOrder: 2;
    readonly value: "ai-gateway-key";
    readonly label: "Vercel AI Gateway API Key";
} | {
    readonly command: "chatgpt";
    readonly commandOrder: 1;
    readonly value: "chatgpt";
    readonly label: "ChatGPT Subscription";
} | {
    readonly command: "openai-api-key";
    readonly commandOrder: 3;
    readonly value: "openai";
    readonly label: "OpenAI API Key";
} | {
    readonly command: "anthropic-api-key";
    readonly commandOrder: 4;
    readonly value: "anthropic";
    readonly label: "Anthropic API Key";
})[];
export declare function loginConnectionForCommand(command: string): ModelConnectionSelection | undefined;
export declare const LOGIN_CONNECTION_COMMAND_HINT: string;
