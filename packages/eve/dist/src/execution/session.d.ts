import type { DurableSession } from "#execution/durable-session-store.js";
import type { HarnessSession, HarnessSessionBase } from "#harness/types.js";
/** Creates a fresh {@link HarnessSession}, with an empty history. */
export declare function createSession(input: {
    readonly continuationToken: string;
    readonly outputSchema?: HarnessSession["outputSchema"];
    /**
     * The top session's id, for a delegated subagent child. `undefined` for top-level sessions:
     * `sessionId` is the root for those.
     */
    readonly rootSessionId?: string;
    readonly sessionId: string;
}): HarnessSession;
/**
 * Mints a continuation token for a delegated subagent session.
 * Deterministic when `suffix` is provided so retries address the same
 * child hook.
 */
export declare function mintSubagentContinuationToken(suffix?: string): string;
/**
 * Projects a {@link HarnessSessionBase} to {@link DurableSession}.
 *
 * Keeps `compaction.lastKnown*` so compaction stays informed after rehydration.
 */
export declare function projectToDurableSession(session: HarnessSessionBase): DurableSession;
/** Rehydrates a {@link HarnessSessionBase} from a {@link DurableSession}. */
export declare function hydrateDurableSession(durable: DurableSession): HarnessSessionBase;
