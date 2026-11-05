import type { ContentPart, Usage } from "../core/types.js";
interface Result {
    usage: {
        inputTokens?: number;
        outputTokens?: number;
        inputTokenDetails?: {
            cacheReadTokens?: number;
            cacheWriteTokens?: number;
        };
    };
    content: readonly unknown[];
}
export declare function modelUsage(usage: Result["usage"]): Usage;
export declare function modelContent(content: Result["content"]): readonly ContentPart[];
export {};
