export type PromptCommandExtensionName = "login" | "model" | "add" | "deploy";
type PromptCommandTarget = "local" | "remote";
/** The slash commands the prompt accepts. */
export type PromptCommand = {
    type: "new";
} | {
    type: "cancel";
} | {
    type: "clear";
} | {
    type: "compact";
} | {
    type: "exit";
} | {
    type: "help";
} | {
    type: "info";
} | {
    type: "loglevel";
    argument: string;
} | {
    type: "traces";
    argument: string;
} | {
    type: "extension";
    name: PromptCommandExtensionName;
    argument: string;
};
/**
 * Metadata for one slash command. The registry describes commands — their
 * names, aliases, and discovery copy — it never executes them: dispatch stays
 * with the runner and the prompt-command handler.
 */
export interface PromptCommandSpec {
    /** Canonical name without the slash, e.g. "model". */
    readonly name: string;
    readonly aliases: readonly string[];
    /** One-line discovery copy shown by the typeahead. */
    readonly description: string;
    /** Optional argument shape shown dim after the name, e.g. "[provider/model]". */
    readonly argumentHint?: string;
    /** Accepts a trailing argument (enables `/name <arg>` parsing). */
    readonly takesArgument: boolean;
    /** Whether recalling this command would reopen a modal or take over prompt navigation. */
    readonly history: "keep" | "omit";
    /** Inline argument suggestions, when this command has a catalog-backed grammar. */
    readonly typeahead?: {
        readonly maxArguments: number;
        readonly loadingLabel: string;
    };
    /** Maps a recognized invocation to its parsed command. */
    readonly build: (argument: string) => PromptCommand;
}
/**
 * Every slash command the prompt accepts, in typeahead display order. One
 * module owns the command list so the runner's dispatch, the renderer's
 * transcript-echo suppression, and command discovery cannot drift apart.
 */
declare const PROMPT_COMMAND_DEFINITIONS: ({
    name: string;
    history: "omit";
    aliases: never[];
    description: string;
    argumentHint: string;
    takesArgument: true;
    typeahead: {
        maxArguments: number;
        loadingLabel: string;
    };
    build: (argument: string) => {
        type: "extension";
        name: "model";
        argument: string;
    };
    targets: "local"[];
} | {
    name: string;
    history: "keep";
    aliases: string[];
    description: string;
    takesArgument: false;
    build: () => {
        type: "new";
    };
    targets: ("local" | "remote")[];
    argumentHint?: undefined;
    typeahead?: undefined;
} | {
    name: string;
    history: "keep";
    aliases: never[];
    description: string;
    takesArgument: false;
    build: () => {
        type: "clear";
    };
    targets: ("local" | "remote")[];
    argumentHint?: undefined;
    typeahead?: undefined;
} | {
    name: string;
    history: "keep";
    aliases: never[];
    description: string;
    takesArgument: false;
    build: () => {
        type: "compact";
    };
    targets: ("local" | "remote")[];
    argumentHint?: undefined;
    typeahead?: undefined;
} | {
    name: string;
    history: "keep";
    aliases: never[];
    description: string;
    takesArgument: false;
    build: () => {
        type: "cancel";
    };
    targets: ("local" | "remote")[];
    argumentHint?: undefined;
    typeahead?: undefined;
} | {
    name: string;
    history: "omit";
    aliases: never[];
    description: string;
    argumentHint: string;
    takesArgument: true;
    typeahead: {
        maxArguments: number;
        loadingLabel: string;
    };
    build: (argument: string) => {
        type: "extension";
        name: "login";
        argument: string;
    };
    targets: "local"[];
} | {
    name: string;
    history: "omit";
    aliases: never[];
    description: string;
    takesArgument: true;
    typeahead: {
        maxArguments: number;
        loadingLabel: string;
    };
    build: (argument: string) => {
        type: "extension";
        name: "add";
        argument: string;
    };
    targets: "local"[];
    argumentHint?: undefined;
} | {
    name: string;
    history: "keep";
    aliases: never[];
    description: string;
    takesArgument: false;
    build: () => {
        type: "extension";
        name: "deploy";
        argument: string;
    };
    targets: "local"[];
    argumentHint?: undefined;
    typeahead?: undefined;
} | {
    name: string;
    history: "omit";
    aliases: never[];
    description: string;
    argumentHint: string;
    takesArgument: true;
    build: (argument: string) => {
        type: "traces";
        argument: string;
    };
    targets: "local"[];
    typeahead?: undefined;
} | {
    name: string;
    history: "omit";
    aliases: never[];
    description: string;
    argumentHint: string;
    takesArgument: true;
    typeahead: {
        maxArguments: number;
        loadingLabel: string;
    };
    build: (argument: string) => {
        type: "loglevel";
        argument: string;
    };
    targets: ("local" | "remote")[];
} | {
    argumentHint?: undefined;
    typeahead?: undefined;
    name: string;
    history: "omit";
    aliases: never[];
    description: string;
    takesArgument: false;
    build: () => {
        type: "info";
    };
    targets: "local"[];
} | {
    argumentHint?: undefined;
    typeahead?: undefined;
    name: string;
    history: "omit";
    aliases: never[];
    description: string;
    takesArgument: false;
    build: () => {
        type: "help";
    };
    targets: ("local" | "remote")[];
} | {
    argumentHint?: undefined;
    typeahead?: undefined;
    name: string;
    history: "keep";
    aliases: string[];
    description: string;
    takesArgument: false;
    build: () => {
        type: "exit";
    };
    targets: ("local" | "remote")[];
})[];
export type ArgumentTypeaheadCommand = Extract<(typeof PROMPT_COMMAND_DEFINITIONS)[number], {
    typeahead: object;
}>["name"];
export declare const PROMPT_COMMANDS: readonly PromptCommandSpec[];
export declare function promptCommandsFor(target: PromptCommandTarget): readonly PromptCommandSpec[];
/** Whether a command runs against this target — the one authority dispatch shares with discovery. */
export declare function isPromptCommandAvailableFor(name: PromptCommandExtensionName, target: PromptCommandTarget): boolean;
/**
 * Recognizes the slash commands the prompt accepts. `/new` (and `/reset`)
 * starts a fresh session and transcript; `/cancel` stops the running turn;
 * `/clear` stops the running turn and clears context in place; `/compact` queues context compaction; `/exit` (and
 * `/quit`) terminate the TUI like Ctrl+C; extension commands are dispatched
 * outside the runner. Anything else — including unknown `/text` — is a normal
 * message.
 */
export declare function parsePromptCommand(prompt: string): PromptCommand | null;
/** Resolve an invocation and its history policy from the same command definition. */
export declare function promptCommandSpec(prompt: string): {
    spec: PromptCommandSpec;
    argument: string;
} | undefined;
/** True for prompts that are commands, which never echo as user messages. */
export declare function isPromptControlCommand(prompt: string): boolean;
/**
 * The table `/help` prints: one line per command — slash name, argument
 * hint, and aliases padded into a column, description after.
 */
export declare function formatPromptCommandHelp(commands?: readonly PromptCommandSpec[]): string;
export {};
