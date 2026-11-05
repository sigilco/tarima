import { type ArgumentTypeaheadCommand } from "./prompt-commands.js";
import type { Theme } from "./theme.js";
export interface PromptArgumentSuggestion {
    readonly value: string;
    readonly label: string;
    readonly hint?: string;
    /** Follow-up values available after selecting this exact value. */
    readonly next?: readonly PromptArgumentSuggestion[];
}
interface ArgumentTypeaheadQuery {
    readonly command: ArgumentTypeaheadCommand;
    readonly argument: string;
    /** Complete arguments before the one currently being typed. */
    readonly completed: readonly string[];
    /** Offset of the current argument in the composer draft. */
    readonly argumentStart: number;
}
export interface ArgumentTypeaheadState extends ArgumentTypeaheadQuery {
    readonly suggestions: readonly PromptArgumentSuggestion[];
    readonly selectedIndex: number;
}
export declare function argumentTypeaheadLoadingLabel(command: ArgumentTypeaheadCommand): string;
/**
 * Parses the active token in an inline command drawer. The command grammar
 * deliberately uses literal spaces, matching slash-command dispatch.
 */
export declare function argumentTypeaheadQuery(text: string): ArgumentTypeaheadQuery | undefined;
/** Filters catalog entries case-insensitively across their visible labels and ids. */
export declare function argumentTypeaheadFor(query: ArgumentTypeaheadQuery, catalog: readonly PromptArgumentSuggestion[], previous?: ArgumentTypeaheadState): ArgumentTypeaheadState;
export declare function moveArgumentTypeaheadSelection(state: ArgumentTypeaheadState, delta: 1 | -1): ArgumentTypeaheadState;
export declare function selectedArgumentSuggestion(state: ArgumentTypeaheadState): PromptArgumentSuggestion | undefined;
/** Replaces only the active argument, retaining selected preceding model tokens. */
export declare function argumentTypeaheadCompletion(state: ArgumentTypeaheadState, suggestion: PromptArgumentSuggestion): string;
/** Paints canonical catalog values under the command's active argument column. */
export declare function renderArgumentSuggestions(state: ArgumentTypeaheadState, theme: Theme, width: number): string[];
export {};
