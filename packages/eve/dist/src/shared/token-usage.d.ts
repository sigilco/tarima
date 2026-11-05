import { z } from "#compiled/zod/index.js";
/** Provider-reported token usage and optional model token cost totals. */
export interface TokenUsage {
    cacheReadTokens: number;
    cacheWriteTokens: number;
    inputTokens: number;
    outputTokens: number;
    costUsd?: number | undefined;
}
/** Current schema for provider-reported token usage and model token cost. */
export declare const tokenUsageWithCostSchema: z.ZodObject<{
    cacheReadTokens: z.ZodNumber;
    cacheWriteTokens: z.ZodNumber;
    inputTokens: z.ZodNumber;
    outputTokens: z.ZodNumber;
    costUsd: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
