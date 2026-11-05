import type { TokenUsage } from "#shared/token-usage.js";
/** What a run's `ctx.agent` sessions have spent, turn by turn. */
export interface RunUsageTally {
    /** Adds one ended turn's usage. */
    record(turnUsage: TokenUsage): void;
    /** The running total, or `undefined` before any turn ended. */
    total(): TokenUsage | undefined;
}
/** `onRecord` runs after each recorded turn, so the run can send a total no reply will carry. */
export declare function createRunUsageTally(onRecord?: () => void): RunUsageTally;
