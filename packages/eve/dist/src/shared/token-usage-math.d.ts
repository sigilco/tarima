import type { TokenUsage } from "#shared/token-usage.js";
/** Adds two usages; the cost is absent only when neither reported one. */
export declare function addTokenUsage(a: TokenUsage, b: TokenUsage): TokenUsage;
/** The new spend in one cumulative report: `total`, less the part of it `counted` earlier. */
export declare function usageSince(total: TokenUsage, counted: TokenUsage | undefined): TokenUsage;
