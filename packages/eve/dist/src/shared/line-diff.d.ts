/** One line of a line diff. `kind` is unset for a line both sides share. */
export interface LineDiffEntry {
    readonly text: string;
    readonly kind?: "added" | "removed";
}
/**
 * Diffs two line lists by longest common subsequence, with each change's
 * removed lines before its added ones. Returns `undefined` when the inputs are
 * too long to compare, so the caller shows something else instead.
 */
export declare function diffLines(before: readonly string[], after: readonly string[]): LineDiffEntry[] | undefined;
