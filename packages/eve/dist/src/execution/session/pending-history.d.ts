import type { SessionStateMap } from "#harness/types.js";
import type { SessionHistoryMessage } from "#shared/session-history.js";
export declare function withPendingHistory(state: SessionStateMap | undefined, history: readonly SessionHistoryMessage[] | undefined): SessionStateMap | undefined;
export declare function readPendingHistory(state: SessionStateMap | undefined): readonly SessionHistoryMessage[];
export declare function withoutPendingHistory(state: SessionStateMap | undefined): SessionStateMap | undefined;
