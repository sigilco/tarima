import type { PromptOption } from "#setup/cli/index.js";
import { type SearchActionOption, type SelectState } from "#setup/cli/select-state.js";
import type { TerminalKey } from "./stream-format.js";
/** Shared navigation grammar for setup selects, actions, and editable selects. */
type SetupSelectionIntent = {
    kind: "cancel";
} | {
    kind: "move";
    direction: "up" | "down";
} | {
    kind: "repaint";
} | {
    kind: "submit";
};
/** Maps terminal keys to the intents every setup selection surface shares. */
export declare function setupSelectionIntent(key: TerminalKey, options?: {
    textNavigation?: boolean;
}): SetupSelectionIntent | undefined;
type SetupSelectInputResult = {
    kind: "cancel";
} | {
    kind: "repaint";
} | {
    kind: "update";
    select: SelectState;
} | {
    kind: "submit";
    values: readonly string[];
} | {
    kind: "error";
    message: string;
} | {
    kind: "ignore";
};
interface SetupSelectInput {
    key: TerminalKey;
    options: readonly PromptOption<string>[];
    searchAction?: SearchActionOption;
    select: SelectState;
}
type SetupSingleSelectInput = SetupSelectInput & {
    kind: "single" | "stacked" | "task-list" | "search";
};
type SetupMultiSelectInput = SetupSelectInput & {
    kind: "multi" | "searchable-multi";
    required: boolean;
    plannerNavigation?: true;
};
type SetupSelectInputState = SetupSingleSelectInput | SetupMultiSelectInput;
/** Pure key transition for a setup select; rendering and lifecycle stay outside. */
export declare function reduceSetupSelectInput(input: SetupSelectInputState): SetupSelectInputResult;
export {};
