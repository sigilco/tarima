/**
 * The transcript block model and its renderer.
 *
 * A {@link Block} is one logical unit of the conversation — a user message, a
 * streamed assistant reply, a reasoning trace, a tool call, a task starting
 * or ending, a log line, and so on. {@link renderBlockLines} turns a block into the
 * exact terminal rows it occupies: a colored gutter glyph, brand-aligned
 * indentation, nesting rules for an agent's own rows, and word-wrapped content — with no
 * boxes anywhere. Every returned row is already styled and fits within the
 * given width, so the live region can place rows verbatim.
 */
import type { ToolDetailLine } from "./line-diff.js";
import type { TaskKind } from "./task-activity.js";
import type { Theme } from "./theme.js";
import type { ToolGroupPresentation } from "./tool-presentation.js";
export type ToolStatus = "running" | "done" | "error" | "denied" | "approval";
export type BlockKind = "user" | "assistant" | "reasoning" | "tool" | "error" | "notice" | "warning" | "result" | "flow" | "command" | "question" | "task" | "subagent-step" | "subagent-tool" | "connection-auth" | "sandbox" | "log" | "turn-stats" | "session-boundary" | "agent-header";
/**
 * One renderable transcript unit. Fields are interpreted per `kind`; unset
 * fields are simply omitted from the rendered output.
 */
export interface Block {
    kind: BlockKind;
    /** Stable id for in-place updates while the block is live. */
    id?: string;
    /** Nesting depth: 0 = top level, 1 = an agent's own row, etc. */
    depth?: number;
    /** Whether the block is still streaming / mutating (drives the activity pulse). */
    live?: boolean;
    /** Primary label — tool name, task name, log source, error title. */
    title?: string;
    /** Past-tense tool label swapped in once the call settles successfully. */
    doneTitle?: string;
    /** Compact secondary text — summarized tool args. */
    subtitle?: string;
    /** Main multi-line content (markdown for prose, plain for logs). */
    body?: string;
    /** User blocks only: steered messages use a yellow gutter. */
    promptOrigin?: "steer" | "queue";
    /** Reasoning trace shown above `body` (subagent steps). */
    reasoning?: string;
    /** One-line summarized result shown after a tool resolves. */
    result?: string;
    /**
     * Errors only: multi-line diagnostic dump (stack trace, cause chain)
     * rendered dim beneath the headline, capped to a handful of lines.
     */
    detail?: string;
    /** Structured remediation shown between an error's body and its detail. */
    hint?: string;
    /**
     * Tool, connection, or completed command lifecycle status. A task line
     * without one marks the task starting; `done`, `error`, and `denied`
     * (stopped) mark it ending.
     */
    status?: ToolStatus;
    /**
     * Connection-auth only: the sign-in URL. Its body row is hard-wrapped like
     * any other, but every wrapped row is an OSC 8 hyperlink to this full URL,
     * so Cmd-click opens the whole link whatever the terminal width.
     */
    link?: string;
    /** When true, treat `body` as pre-styled and only wrap + indent it. */
    preformatted?: boolean;
    /** Reasoning only: collapse the trace to a single "thinking" line. */
    collapsed?: boolean;
    /** When true, expand tool input/output instead of summarizing. */
    expanded?: boolean;
    /** Captured-log visibility used for concise-vs-raw diagnostic replay. */
    logVisibility?: "summary" | "all-only";
    logLevel?: "error" | "warn" | "info" | "debug";
    /** Raw tool input / output for the expanded view. */
    toolInput?: unknown;
    toolOutput?: unknown;
    /** Original execution name, kept separate from a semantic display title. */
    toolName?: string;
    /** Optional aggregation metadata; execution state remains on this call's block. */
    toolGroup?: ToolGroupPresentation;
    /** Salient body lines rendered behind the `│` rail under the tool header. */
    detailLines?: readonly ToolDetailLine[];
    /** When true, `detailLines` stay visible after the call settles (writes). */
    keepDetailWhenDone?: boolean;
    /** The agent call an agent's own row belongs to. */
    subagentCallId?: string;
    /** The agent an agent's own row belongs to, named above its first row. */
    agentName?: string;
    /** Task lines only: whether an agent or a tool does the work. */
    taskKind?: TaskKind;
    /**
     * Monotonic activity stamp, bumped on every push and in-place update.
     * Recency windows key on it so a parallel-announced call that just
     * settled counts as newer than a later-announced one still idle.
     */
    updateSeq?: number;
}
/**
 * What the renderers actually draw: an execution {@link Block} plus the
 * synthesized presentation the display grouping may attach. Only the
 * grouping layer creates these fields, so an execution block can never
 * smuggle display state — the type boundary enforces what used to be a
 * comment.
 */
export interface DisplayBlock extends Block {
    /** Items listed when equivalent tool calls are coalesced into one row. */
    toolGroupItems?: readonly ToolGroupItem[];
    /** Earlier captured writes merged into this log section; renders as `… +N more`. */
    elided?: number;
}
/** One coalesced call's row beneath an aggregated tool header. */
export interface ToolGroupItem {
    readonly text: string;
    /** Per-call failure summary, present when a failed batch is aggregated. */
    readonly result?: string;
}
export interface RenderBlockContext {
    /** Current shared square-pulse frame for live activity blocks. */
    activityPulse: string;
    /** An open setup panel owns the pulse, so a running command's gutter holds still. */
    setupFlowOpen?: boolean;
    /** A transient panel keeps its command echo live without a progress glyph. */
    transientPanelOpen?: boolean;
    /** Whether prose responses are parsed and styled as Markdown. */
    renderMarkdown?: boolean;
    /**
     * Kind and title of the block rendered immediately above this one. Lets a
     * sandbox block detect that it continues a run (label suppressed, lines
     * hang under the previous block's label) without any mutable run state —
     * each captured write stays its own immediately-committed block.
     */
    previous?: {
        kind: BlockKind;
        title?: string;
        subagentCallId?: string;
    };
}
/**
 * Renders a block to its terminal rows. Each row is fully styled and clipped
 * to `width` visible columns.
 */
export declare function renderBlockLines(block: DisplayBlock, width: number, theme: Theme, context: RenderBlockContext): string[];
/**
 * The setup attention line (`⚠ 1 setup issue: … · /model`): yellow glyph, body
 * at full intensity, slash commands painted blue so the fix reads as actionable
 * — clearly a system surface, not chat content. Exported so the live footer can
 * render the same line as a clearable element (it disappears once the issue is
 * resolved), not just committed scrollback.
 */
export declare function renderAttentionRows(body: string, width: number, theme: Theme): string[];
