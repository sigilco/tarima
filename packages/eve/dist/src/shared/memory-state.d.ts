import type { MemoryRecallResult, MemoryScope, MemoryScopeResolverResult } from "#public/memory/index.js";
export interface NormalizedMemoryRecallMessage {
    readonly content: string;
    readonly itemKey?: string;
}
/** The scope a memory slot operates under. */
export declare function createMemoryScope(input: {
    readonly namespace: string;
    readonly scope: Exclude<MemoryScopeResolverResult, null>;
    readonly slot: string;
}): MemoryScope;
export declare function validateMemoryRecallResult(result: MemoryRecallResult, slot: string): readonly NormalizedMemoryRecallMessage[];
