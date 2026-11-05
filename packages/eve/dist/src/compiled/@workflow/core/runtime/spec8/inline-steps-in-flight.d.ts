/**
 * The inline steps one workflow delivery is executing, across passes of its
 * replay loop.
 *
 * The inline loop runs a batch of steps in parallel. Waiting for the whole
 * batch before replaying makes parallel branches advance in lockstep: a branch
 * whose step settled cannot start its next step until the slowest sibling
 * settles. With early advance (`isInlineEarlyAdvanceEnabled`), the loop
 * instead replays as soon as one step settles cleanly, and the steps still
 * running stay here, owned by this delivery, until a later pass collects them.
 *
 * Every tracked step is settled before the delivery acknowledges its message,
 * since crash recovery of an inline-owned step depends on the owning message
 * being redelivered.
 */
export interface InlineStepSettlement<Step, Result> {
    step: Step;
    outcome: PromiseSettledResult<Result>;
}
export interface InlineSettlementRound<Step, Result> {
    /**
     * The loop may replay now with the remaining steps still running: every
     * settled step settled cleanly, at least one step is still running, and
     * every running step's claim has settled.
     */
    early: boolean;
    /** The settled steps, removed from tracking, in the order they started. */
    settled: InlineStepSettlement<Step, Result>[];
}
export declare class InlineStepsInFlight<Step extends {
    correlationId: string;
}, Result> {
    #private;
    /**
     * Correlation ids of every tracked step, settled or not, until a settlement
     * round takes it. A replay pass must leave these steps alone: one whose
     * execution settled after the pass loaded its log still reads as pending
     * there, owned by this delivery.
     */
    get ids(): ReadonlySet<string>;
    get size(): number;
    /** Tracked steps whose execution has not settled yet. */
    get running(): number;
    track(step: Step, execution: Promise<Result>, startSettled: Promise<void>): void;
    /**
     * Wait until at least one tracked step settled. With `allowEarly`, return
     * early when every settled step passes `isClean` and some step is still
     * running; otherwise wait for every tracked step.
     *
     * Before returning early, waits for every running step's claim to settle,
     * so a step this delivery is executing is durably started before the next
     * pass can create a hook or wait and let a concurrent delivery replay.
     */
    settle(allowEarly: boolean, isClean: (outcome: PromiseSettledResult<Result>) => boolean): Promise<InlineSettlementRound<Step, Result>>;
    /** Wait for every tracked step and remove them all from tracking. */
    settleAll(): Promise<InlineStepSettlement<Step, Result>[]>;
}
//# sourceMappingURL=inline-steps-in-flight.d.ts.map