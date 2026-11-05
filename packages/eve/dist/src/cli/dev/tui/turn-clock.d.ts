import type { TokenUsage } from "./conversation-view.js";
/**
 * One turn's wall clock and token flow, measured against the session's summed
 * step usage when work started. Armed when work starts and consumed once by
 * the end-of-turn coda, so answering an approval or question mid-turn does
 * not split the turn.
 */
export declare class TurnClock {
    #private;
    arm(usage: TokenUsage): void;
    get armed(): boolean;
    get startedAtMs(): number | undefined;
    /** Token flow since the clock was armed. */
    usage(current: TokenUsage): TokenUsage;
    /** Consumes the armed clock, or returns `undefined` when no turn was armed. */
    settle(current: TokenUsage): ({
        elapsedMs: number;
    } & TokenUsage) | undefined;
    /** Drops the clock without a coda (conversation boundaries). */
    reset(): void;
}
