import type { ModelMessage } from "ai";
import { type ApprovalMemory } from "#approval/evaluation.js";
import type { ResponderCheck } from "./responders.js";
import type { AuthorizationChallenge } from "#harness/authorization.js";
import type { StoppedCall } from "#harness/inline-tool-authorization.js";
import { type LimitAsk } from "#harness/hitl/budget-request.js";
import type { HarnessStepInput } from "#harness/types.js";
import type { InteractionRow } from "#protocol/session-projection/tables.js";
import type { RuntimeWorkflowTaskRequest } from "#shared/action-types.js";
import type { Transition } from "#harness/session-machine/commit.js";
import { type ResolvedStepInput } from "./delivery.js";
import type { ApprovalAsk, ApprovedCall, StepCoordinates, SuspendedStep } from "#harness/session-machine/view.js";
import { type SessionView } from "#harness/session-machine/view.js";
/**
 * A model response made calls that need a person's approval. The response waits in a suspended
 * step, beside any runtime calls it made. The approvals are asked now, or once the step's tasks
 * finish (`openDeferredApprovals`).
 */
export declare function askApprovals(view: SessionView, input: {
    readonly event: StepCoordinates;
    readonly messages: readonly ModelMessage[];
    readonly requests: readonly ApprovalAsk[];
    readonly tasks: readonly RuntimeWorkflowTaskRequest[];
    readonly responseAuthRequiredRequestIds?: readonly string[];
    readonly requester?: SuspendedStep["requester"];
}): Transition;
/** A step that parked approvals beside its tasks asks for them once the tasks finish. */
export declare function openDeferredApprovals(view: SessionView): Transition;
/** Approved workflow and agent calls join the runs their requesting steps wait on. */
export declare function dispatch(view: SessionView, input: {
    readonly tasks: readonly RuntimeWorkflowTaskRequest[];
}): Transition;
/** Turn input the turn can't take yet waits, unreceived, for a later step. */
export declare function queueInput(view: SessionView, input: HarnessStepInput | undefined): Transition;
/**
 * A delivery's answers reach the session: each is submitted once, and stands, admitted, once
 * its responder may answer. An answer a response policy still weighs stays submitted. What a
 * responder may not do refuses their delivery, with why.
 */
export declare function admitAnswers(view: SessionView, input: {
    readonly delivery: ResolvedStepInput | undefined;
    readonly check: ResponderCheck;
}): Transition;
/** A call cleared to run now, with the step that asked, whose tools it runs with. */
export interface RunnableCall {
    readonly approval: ApprovedCall;
    readonly step: SuspendedStep;
}
/**
 * A step's approvals settle together, once each has a standing answer. A message steers past
 * them instead: the answers given stand, and the approvals nobody answered are withdrawn.
 * Approved calls are returned to run; denied ones get their denial as a result.
 * A request that asked to be remembered records the decision. `answered` says a step settled on
 * its answers rather than a message.
 */
export declare function settleApprovals(view: SessionView, input: {
    readonly steer: boolean;
}): Transition & {
    readonly approved: readonly RunnableCall[];
    readonly answered: boolean;
};
/**
 * Approvals whose tool went away: no answer can run their calls, so nobody needs them anymore.
 * Each call fails, and the model reads why.
 */
export declare function withdrawUnavailable(view: SessionView, input: {
    readonly interactionIds: readonly string[];
    /** The step offers `eve__search`, which an unavailable tool's message points to. */
    readonly searchable: boolean;
}): Transition;
export declare function approvalMemory(view: SessionView): ApprovalMemory;
/** The budget prompt the session waits on, with the turn it asked in, if any. */
export declare function openLimit(view: SessionView): {
    readonly row: InteractionRow;
    readonly turnId?: string;
} | undefined;
/**
 * The session spent its budget: it asks whether to continue instead of calling the model.
 * `settleLimit` grants a fresh budget or declines it.
 */
export declare function requestLimit(view: SessionView, ask: LimitAsk): Transition;
/**
 * The budget prompt settles on its standing answer: Continue grants a fresh budget, and Stop
 * declines it. Any other answer is refused, and the prompt stays open for another.
 */
export declare function settleLimit(view: SessionView): Transition & {
    readonly limit?: {
        readonly granted: boolean;
    };
};
/**
 * The held turn moves on, steered: the sign-ins it waits on are withdrawn, including a
 * responder's for one of its approvals, and the calls that waited for them fail with `reason`.
 */
export declare function withdrawSignIns(view: SessionView, reason: string): Transition;
/**
 * Work needs a sign-in. The calls that need it stop and wait in their steps; an attempt it
 * replaces fails; and each sign-in is asked for and recorded. The turn holds until every sign-in
 * calls back, and then the stopped calls run. Input that waited on a responder's sign-in stays
 * queued for it.
 */
export declare function requireSignIn(view: SessionView, input: {
    readonly challenges: readonly AuthorizationChallenge[];
    readonly calls?: readonly StoppedCall[];
    readonly queued?: HarnessStepInput;
}): Transition;
