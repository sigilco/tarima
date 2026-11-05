import type { HarnessSession, HarnessStepInput, StepResult } from "#harness/types.js";
export declare function runModelCallBatch(input: {
    readonly steeringSignal?: AbortSignal;
    readonly initialInput: HarnessStepInput | undefined;
    readonly initialSession: HarnessSession;
    readonly modelCallsPerStep: number;
    readonly runStep: (input: {
        readonly firstCall: boolean;
        readonly session: HarnessSession;
        readonly stepInput: HarnessStepInput | undefined;
    }) => Promise<StepResult>;
}): Promise<StepResult>;
