import type { SessionStreamEvent } from "#protocol/session-event.js";
import type { EveEvalDerivedFacts } from "#evals/types.js";
export interface DeriveRunFactsOptions {
    /** Session id stamped onto every derived tool call, skill load, and subagent call. */
    readonly sessionId?: string;
    /** Session events through this turn: cumulative usage and reusable task/child metadata. */
    readonly usageEvents?: readonly SessionStreamEvent[];
}
/**
 * What a segment of a session's events did: its tool calls, skill loads and subagent calls, the
 * requests it opened, its content and models, read from the session's tables as the segment
 * leaves them. A call counts when the segment requested or settled it, as an approved call
 * requested in an earlier segment is; a subagent call when the segment started it on its task.
 */
export declare function deriveRunFacts(events: readonly SessionStreamEvent[], options?: DeriveRunFactsOptions): EveEvalDerivedFacts;
export declare function createEmptyDerivedFacts(): EveEvalDerivedFacts;
