import type { AssistantResponseStatsMode, LogDisplayMode, SubagentDisplayMode, TerminalPartDisplayMode, TuiDisplayOptions } from "#cli/dev/tui/types.js";
/** Parsed `eve dev` options that control terminal-UI behavior. */
interface DevelopmentTuiOptions {
    readonly assistantResponseStats?: AssistantResponseStatsMode;
    readonly showConnectionAuth?: TerminalPartDisplayMode;
    readonly contextSize?: number;
    readonly logs?: LogDisplayMode;
    readonly showReasoning?: TerminalPartDisplayMode;
    readonly showSubagents?: SubagentDisplayMode;
    readonly showTools?: TerminalPartDisplayMode;
    readonly ui?: boolean;
}
/** Whether `eve dev` launches the terminal UI or keeps only the server running. */
type DevUiMode = "tui" | "headless";
/** Resolves the UI mode from parsed flags and terminal interactivity. */
export declare function resolveDevUiMode(input: {
    readonly options: Pick<DevelopmentTuiOptions, "ui">;
    readonly interactive: boolean;
}): DevUiMode;
/** Builds terminal-UI display options with the defaults used by `eve dev`. */
export declare function resolveTuiDisplayOptions(options: DevelopmentTuiOptions): TuiDisplayOptions;
export {};
