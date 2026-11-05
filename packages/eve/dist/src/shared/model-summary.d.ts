/** Compact display label for the dev TUI: `model · reasoning · ⚡︎`. */
export declare function formatModelSummary(input: {
    model: string;
    /** Authored reasoning level; omitted renders the bare slug. */
    reasoning?: string;
    /** Speed marker glyph, present for intrinsic speed or the priority tier. */
    fastGlyph?: string;
}): string;
