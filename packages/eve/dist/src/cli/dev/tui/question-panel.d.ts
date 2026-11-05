/**
 * Pure rendering for the HITL question drawer — a pending question request
 * (such as one from `ask_question` or `ctx.ask()`) opens above the input area.
 * Options render as numbered rows with their
 * descriptions always visible, and the trailing "Type your own answer" row
 * carries an inline elbow editor that receives focus the moment the cursor
 * rests on it (the provider-key grammar from the setup panel). The renderer
 * hosts lifecycle and keys; this module only paints rows.
 */
import type { AgentTUIInputContext, AgentTUIInputOption } from "./runner.js";
import { type LineState } from "./line-editor.js";
import type { Theme } from "./theme.js";
interface QuestionPanelState {
    readonly prompt: string;
    readonly options: readonly AgentTUIInputOption[];
    /** Row index under the cursor; `options.length` is the freeform row. */
    readonly cursor: number;
    /** Whether the trailing freeform row exists. */
    readonly allowFreeform: boolean;
    /** The freeform row's inline editor; focused while the cursor rests on it. */
    readonly editor: LineState;
    readonly caretVisible: boolean;
    readonly maxRows?: number;
}
export declare function renderQuestionPanel(state: QuestionPanelState, theme: Theme, width: number): string[];
export declare function renderQuestionPrompt(prompt: string, theme: Theme, width: number): string[];
/** Window the body, keeping the focused choice or editor reachable on short terminals. */
export declare function fitQuestionPanel(rows: readonly string[], maxRows: number, focusedRow?: number, focusedEndRow?: number): string[];
/** Who asked for a prompt and where it sits among the open requests, for the drawer's corner. */
export declare function inputContextLabel(context: AgentTUIInputContext | undefined, theme: Theme): string | undefined;
export {};
