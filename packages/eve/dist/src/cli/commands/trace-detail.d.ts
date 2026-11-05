/**
 * Span-level detail rendering for `eve traces`. Kept separate from the command
 * module: the tree renderer stays compact while these helpers answer "what
 * does this span carry" — inline metric chips and the `--verbose` per-span block.
 */
import type { LocalTraceSpan } from "#tracing/local/trace-reader.js";
import { type LocalTraceSummary } from "#tracing/local/trace-summary.js";
/**
 * Compact metrics for one tree row: token chips (`↑1.4K`/`↓213`), cost
 * (`$0.0031`). Only chips whose attributes the span actually carries — rows
 * without usage stay clean. Tool names belong to eve's durable `execute_tool`
 * label instead of the AI SDK's child span.
 * Raw values: callers sanitize for their output surface.
 */
export declare function spanMetricChips(span: LocalTraceSpan): string[];
/** One-line `Tokens` header value: `↑1.2K in · ↓340 out · 1.1K cached`. */
export declare function formatTokenSummary(summary: Pick<LocalTraceSummary, "inputTokens" | "outputTokens" | "cacheReadTokens" | "cacheWriteTokens">): string;
/** Formats a USD cost: `$1.50` at scale, `$0.0031` for typical spans. */
export declare function formatCostUsd(costUsd: number): string;
/**
 * The `--verbose` block for one span: facts (status, timing, ids), every
 * attribute sorted with payloads rendered as transcripts/pretty JSON, then
 * every event with its offset from span start, rendered as `tree(1)`-style
 * entries: each fact, attribute key, and event is an entry with a connector
 * beneath the span's row, so the rails never break. Payload content wraps
 * under its key on a plain margin. `childrenFollow` decides whether the last
 * entry closes the branch — child span rows come after the detail entries.
 */
export declare function renderSpanDetailTree(span: LocalTraceSpan, options: {
    readonly childrenFollow: boolean;
    readonly margin: string;
    readonly mute: (text: string) => string;
    readonly width: number;
}): string[];
