import type { SessionStateMap } from "#harness/types.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
import type { TokenUsage } from "#shared/token-usage.js";
export declare const NO_USAGE: TokenUsage;
/** Lifetime spend comes only from committed usage facts, including delegated spend. */
export declare function sessionUsage(session: {
    readonly state?: SessionStateMap;
}): TokenUsage;
/** Own model runs include summaries; delegated spend belongs to the calls that delegated. */
export declare function turnUsage(view: SessionView, turnId: string): TokenUsage;
/** A persistent child reports each committed unit of spend to its parent exactly once. */
export declare function takeSessionUsageDelta<T extends {
    readonly state?: SessionStateMap;
}>(session: T): {
    readonly delta: TokenUsage;
    readonly session: T;
};
/** Spend outside a turn must not be claimed again by a later turn's report. */
export declare function markUsageReported<T extends {
    readonly state?: SessionStateMap;
}>(session: T, usage: TokenUsage): T;
export declare function withModelUsage(view: SessionView, usage: TokenUsage): SessionView;
