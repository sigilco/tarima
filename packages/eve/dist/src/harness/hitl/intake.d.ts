import type { Step } from "#harness/step/context.js";
import type { HarnessStepInput, StepResult } from "#harness/types.js";
import { type RunnableCall } from "./approvals.js";
/**
 * What a delivery leaves for its step once its answers are admitted. `stop` ends the step: a
 * response policy committed and runs next step, or a responder must sign in first. `run` carries
 * the turn's input, without the answers, and whether a message steers the turn.
 */
export type HumanInputIntake = {
    readonly kind: "stop";
    readonly result: StepResult;
} | {
    readonly kind: "run";
    readonly input: HarnessStepInput | undefined;
    /** The message the turn receives, as the stream shows it. */
    readonly message?: HarnessStepInput["message"];
    /** A plain-text answer consumed the message, so the model never reads it. */
    readonly consumedMessage: boolean;
    /** The delivery carries input for a turn. */
    readonly opensTurn: boolean;
    /** A message steers the turn past what it waits on. */
    readonly steer: boolean;
};
/**
 * Admits a delivery's answers: a sign-in callback completes its sign-in, a stale answer becomes
 * text, a typed one the answer it stands for, and each answer stands once its checks and response
 * policy allow it. Nothing is decided here; `settleHumanInput` decides.
 */
export declare function admitHumanInput(step: Step, input: HarnessStepInput | undefined, options: {
    readonly takeQueued: boolean;
}): Promise<HumanInputIntake>;
/**
 * What the person decided: the budget answer, and the calls that run now: those they approved,
 * and those a sign-in stopped whose sign-ins have called back.
 */
export interface HumanDecisions {
    readonly limit?: {
        readonly granted: boolean;
    };
    readonly approved: readonly RunnableCall[];
    /** Approvals settled on their answers: the model reads their results before the turn input. */
    readonly settledApprovals: boolean;
}
/**
 * The person's standing answers decide what they answer: the budget prompt settles, and each
 * step's approvals settle together once each has an answer, or when a message steers past them.
 * A call a sign-in stopped runs once its sign-ins have called back, as the call that asked.
 */
export declare function settleHumanInput(step: Step, intake: Extract<HumanInputIntake, {
    readonly kind: "run";
}>): Promise<HumanDecisions>;
/**
 * What the decisions do once the turn has the delivery: a budget answer grants a fresh budget or
 * ends the turn tree, the steps denials completed commit, and approved calls run.
 */
export declare function applyHumanDecisions(step: Step, decided: HumanDecisions): Promise<StepResult | undefined>;
