import type { AssertionResult } from "#evals/types.js";
/**
 * The name an assertion is exported under: its label when it has one, so a
 * labeled assertion keeps a stable column however its display name is built.
 * Gates carry a `gate:` prefix so they do not share a column with a soft
 * assertion of the same name, and so experiments diff gate regressions the
 * same way they diff soft scores. Sinks with stricter label rules normalize
 * this name themselves.
 */
export declare function exportedAssertionName(assertion: AssertionResult): string;
/** Assertions reported under one name, scored together. */
export interface AssertionScoreGroup {
    /** Lowest completed score in the group; absent when every member errored. */
    readonly score: number | undefined;
    readonly assertions: readonly AssertionResult[];
}
/**
 * Groups an eval's assertions by reported name and scores each group by its lowest member.
 *
 * Repeated assertions, such as several unlabeled judges, share a name. The minimum keeps one
 * comparable score per name, and a group passes only when every member does.
 */
export declare function groupAssertionScores(assertions: readonly AssertionResult[], getName: (assertion: AssertionResult) => string): Map<string, AssertionScoreGroup>;
/** Per-assertion scores retained in row metadata once repeated assertions share one score. */
export declare function composeAssertionScoreMetadata(assertions: readonly AssertionResult[]): {
    key: string | undefined;
    name: string;
    severity: import("#evals/types.js").AssertionSeverity;
    score: number | undefined;
}[];
