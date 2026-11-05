interface ExactEdit {
    readonly oldText: string;
    readonly newText: string;
}
/** Applies unique, non-overlapping replacements matched against the original content. */
export declare function applyExactEdits(content: string, edits: readonly ExactEdit[]): string;
declare const _default: import("eve/tools").ToolDefinition<Record<string, unknown>, {
    path: string;
    replacements: number;
}> & {
    execute(input: Record<string, unknown>, ctx: import("eve/tools").ToolContext): Promise<{
        path: string;
        replacements: number;
    }>;
};
export default _default;
