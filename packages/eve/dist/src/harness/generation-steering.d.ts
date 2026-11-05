import type { SessionEvent } from "#protocol/session-event.js";
/** Interrupts generation without cancelling the turn or replaying local effects. */
export declare class GenerationSteering {
    private readonly controller;
    private active;
    private effectsStarted;
    private readonly steeringSignal;
    readonly signal: AbortSignal;
    outputStarted: boolean;
    constructor(input: {
        abortSignal?: AbortSignal;
        steeringSignal?: AbortSignal;
        outputStarted?: boolean;
    });
    get interrupted(): boolean;
    begin(): void;
    /** Steering cut the generation; what the step still publishes settles it, so nothing stops it. */
    end(): void;
    protectToolExecution(): void;
    beforeEvent(event: SessionEvent): void;
    check(): void;
    dispose(): void;
    private readonly onSteering;
}
