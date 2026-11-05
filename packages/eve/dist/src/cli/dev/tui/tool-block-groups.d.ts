import type { Block, DisplayBlock } from "./blocks.js";
interface ToolBlockDisplayGroup {
    readonly members: readonly Block[];
    readonly display: DisplayBlock;
}
/**
 * Coalesces presentation only; each member keeps its call id and lifecycle.
 *
 * A contiguous run of equivalent tool calls is partitioned by status, so a
 * batch with interleaved outcomes renders as one succeeded aggregate and one
 * failed aggregate instead of fragmenting on every status flip. Captured log
 * writes coalesce per
 * {@link GroupToolBlocksOptions.logCoalescing}. Because of all this, a
 * group's members are not always contiguous in the input: callers that
 * consume a group must remove its members by identity, never by prefix
 * length.
 */
interface GroupToolBlocksOptions {
    /**
     * How captured log writes coalesce. `"window"` (the default, for the live
     * block window) merges every write of one source across the whole input
     * into a single section appended after the rest — a process stream is
     * continuous, so interleaved activity must not fragment it — and the
     * section commits as one cluster at the turn boundary. `"runs"` (for
     * committed-transcript rebuilds) merges only contiguous writes, so a
     * `/loglevel` toggle re-renders history at its committed positions instead
     * of relocating every past write to the end.
     */
    readonly logCoalescing?: "window" | "runs";
}
export declare function groupToolBlocksForDisplay(blocks: readonly Block[], options?: GroupToolBlocksOptions): ToolBlockDisplayGroup[];
/**
 * What an agent did, for the line its task ends on: counted settled work plus
 * a failure count, so an error folds into the summary without vanishing from
 * it. `undefined` when the agent ran no tools.
 */
export declare function summarizeChildTools(children: readonly Block[]): string | undefined;
export {};
