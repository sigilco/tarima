/**
 * Detects whether emitted extension modules call `defineState` from
 * `eve/context`. Usage is followed through local re-export barrels — aliased
 * re-exports, `export *`, and import-then-re-export chains — so indirect
 * usage still stamps the `state` capability requirement.
 */
export declare function extensionUsesState(runtimeRoot: string): Promise<boolean>;
