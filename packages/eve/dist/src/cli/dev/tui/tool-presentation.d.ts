import { type ToolDetailLine } from "./line-diff.js";
/** Renderer-ready copy derived from a tool call without owning its lifecycle. */
interface ToolPresentation {
    readonly title: string;
    readonly subtitle: string;
    readonly summarizeResult: (output: unknown) => string | undefined;
    readonly group?: ToolGroupPresentation;
    /** Past-tense title used once the call settles successfully. */
    readonly doneTitle?: string;
    /** Salient body lines shown behind the `│` rail under the header. */
    readonly detail?: readonly ToolDetailLine[];
    /** When true, `detail` stays visible after the call settles (writes). */
    readonly keepDetailWhenDone?: boolean;
}
/**
 * Renderer-owned knowledge a presentation may fold in: what a write replaced
 * (from the session's file-content cache) and whether the file existed (from
 * the call's result, once it arrives).
 */
export interface ToolPresentationContext {
    readonly previousContent?: string;
    readonly existed?: boolean;
    /**
     * True when the tool dispatches a named subagent (each subagent exposes a
     * tool bearing its own name). The presentation reads as a delegation —
     * `Delegate subagent(stock price)` — instead of a generic tool call.
     */
    readonly isSubagent?: boolean;
    /** The tool's own `label.start` copy, used when eve has no copy of its own for the tool. */
    readonly label?: string;
    /** The tool's own `label.complete` copy, shown once the call succeeds. */
    readonly completeLabel?: string;
}
/** Copy needed to aggregate equivalent calls without merging their state. */
export interface ToolGroupPresentation {
    readonly verb: string;
    readonly pastVerb: string;
    readonly singularNoun: string;
    readonly pluralNoun: string;
    readonly item: string;
}
/**
 * Extracts a write tool call's full-replacement payload. Exported so the
 * renderer can feed its file-content cache from the same contract the
 * presentation reads.
 */
export declare function readWriteFileInput(toolName: string, input: unknown): {
    path: string;
    content: string;
} | undefined;
/**
 * Turns known tool contracts into concise activity copy. Unknown or malformed
 * calls keep the generic formatter, so presentation can never break execution.
 */
export declare function presentTool(toolName: string, input: unknown, context?: ToolPresentationContext): ToolPresentation;
/**
 * A person's name for a tool with no copy of its own: `linear__list_issues` →
 * `List issues`.
 */
export declare function toolDisplayTitle(toolName: string): string;
/**
 * The bundled self-modification subagent's compiled name: its extension
 * namespace joined to `subagents/agent` by the compiler's `__` rule.
 */
export declare const SELF_MODIFICATION_AGENT_NAME = "self-modification__agent";
/** True for the bundled self-modification subagent's dispatch tool. */
export declare function isSelfModificationAgent(toolName: string): boolean;
/**
 * The name an agent task goes by in the delegate row, task line, and task
 * panel, from its {@link agentDisplayName} and any `:N` ordinal.
 */
export declare function agentTaskLabel(name: string): string;
/**
 * A person's name for the agent a tool dispatches: `crm__researcher` →
 * `researcher`. An extension's own subagent compiles to `<extension>__agent`, so
 * the extension names it.
 */
export declare function agentDisplayName(toolName: string): string;
/**
 * Placeholder copy for a call whose input is still streaming from the model
 * (`action.input.appended`). Known tools lead with their activity verb so the
 * row already reads as intent (`Fetch …`); unknown tools lead with their name.
 * The full presentation replaces this once the input arrives.
 */
export declare function presentPreparingTool(toolName: string, context?: ToolPresentationContext): ToolPresentation;
/**
 * Tools whose whole story renders through a dedicated surface — the question
 * overlay — instead of a transcript tool block. Both the preparing
 * announcement and the full call must agree on this set, or a panel-routed
 * tool ghosts as a preparing block.
 */
export declare function isPanelRoutedTool(toolName: string): boolean;
/** The tool's short name with any connection/server namespace stripped. */
export declare function toolBaseName(toolName: string): string;
export {};
