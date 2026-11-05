/** Rejects static names that fall under a static connection's name or `__` prefix. */
export declare function assertStaticConnectionOwnership(input: {
    readonly connectionNames: readonly string[];
    readonly subagentNames: readonly string[];
    readonly toolNames: readonly string[];
}): void;
