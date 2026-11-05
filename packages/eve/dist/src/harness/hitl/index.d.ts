import type { ApprovalMemory } from "#approval/evaluation.js";
import type { ModelMessage } from "ai";
import type { resolveInlineAuthorizationInterrupt } from "#harness/inline-tool-authorization.js";
import type { Step } from "#harness/step/context.js";
import type { HarnessSessionBase, HarnessToolLookup, StepInput, StepResult } from "#harness/types.js";
import type { RuntimeWorkflowTaskRequest } from "#shared/action-types.js";
import type { ApprovalAsk, StepCoordinates } from "#harness/session-machine/view.js";
export { admitHumanInput, applyHumanDecisions, settleHumanInput, type HumanDecisions, type HumanInputIntake, } from "./intake.js";
export { openDeferredApprovals, queueInput } from "./approvals.js";
export { compactInput, turnInputOnly, withoutTurnInput } from "./delivery.js";
export type { PendingResponder } from "./responders.js";
/**
 * A model step made calls that need a person's approval: the step's response waits on them
 * beside any runtime calls it made, asked as the turn's requester.
 */
export declare function askStepApprovals(step: Step, input: {
    readonly event: StepCoordinates;
    readonly messages: readonly ModelMessage[];
    readonly requests: readonly ApprovalAsk[];
    readonly tasks: readonly RuntimeWorkflowTaskRequest[];
    /** The entries the step's calls ran, whose approvals the requests ask for. */
    readonly tools: HarnessToolLookup;
}): Promise<void>;
/**
 * A call the model step ran needs a sign-in: the calls that need it stop and wait in their
 * steps, and run once it completes.
 */
export declare function stopForToolSignIn(step: Step, interrupt: NonNullable<ReturnType<typeof resolveInlineAuthorizationInterrupt>>): Promise<StepResult>;
/**
 * The gate before each model call. A spent budget asks whether to continue when someone can
 * answer, and fails the session otherwise. `messages` are the step's: they park with the prompt,
 * so the input that triggered it survives into the turn that resumes.
 */
export declare function enforceBudget(step: Step, messages: readonly ModelMessage[]): Promise<StepResult | undefined>;
/** What a model call needs from the approvals: what their policies remember. */
export declare function humanInputContext(step: Step): {
    readonly approvalMemory: ApprovalMemory;
};
/**
 * Takes the message a delivery's answers deferred into the turn queue out of it, so a cancelled
 * turn can keep it in history once instead of also leaving it queued. The rest of the queue stays.
 */
export declare function takeDeferredMessage<T extends HarnessSessionBase>(session: T): {
    readonly message?: StepInput["message"];
    readonly session: T;
};
export { readHitlState } from "./requests.js";
export { holdsHitlRequests } from "./view.js";
