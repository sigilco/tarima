import type { SubagentInteractionHookPayload } from "#channel/types.js";
import type { AuthorizationChallenge } from "#harness/authorization.js";
import { type InterruptedCall } from "#harness/interrupted-attempt.js";
import type { RuntimeIdentity, TraceContext, SessionPredecessor } from "#protocol/session-events/families/session.js";
import type { TaskCancelReason } from "#execution/tasks/table.js";
import type { DeliverySource, ImportedMessage } from "#protocol/session-events/families/delivery.js";
import type { ControlDelivery } from "#harness/types.js";
import type { ResponseSubmittedData } from "#protocol/session-events/families/response.js";
import type { SessionEvent } from "#protocol/session-event.js";
import type { Cause, Principal, UserPart } from "#protocol/session-events/envelope.js";
import type { TokenUsage } from "#shared/token-usage.js";
import type { FactOf } from "#protocol/session-events/facts.js";
import type { RuntimeActionResult } from "#shared/action-types.js";
import type { Answer } from "#shared/input.js";
import type { JsonObject, JsonValue } from "#shared/json.js";
import { type Transition } from "./commit.js";
import type { HistoryChange } from "./history.js";
import type { WorkflowAskRoute } from "#harness/hitl/relays.js";
import type { StoppedCall } from "#harness/inline-tool-authorization.js";
import type { ApprovedCall, SuspendedStep, TurnState } from "./state.js";
import { type SessionView } from "./view.js";
import { type ToolResultPart } from "./suspended-steps.js";
/** A delivery a turn consumes, with what the person sent: nothing for an answer or context. */
export interface ConsumedDelivery {
    readonly deliveryId: string;
    readonly parts: readonly UserPart[];
    /** Earlier conversation the delivery brought, which its consumption records. */
    readonly history?: readonly ImportedMessage[];
}
/**
 * Deliveries arrive for a turn: the session starts once, a turn opens unless one is open, and
 * each delivery is consumed into it.
 */
export declare function receive(view: SessionView, input: {
    readonly deliveries?: readonly ConsumedDelivery[];
    /** What starts the turn when no delivery does. */
    readonly cause?: Cause;
    readonly parent?: {
        readonly sessionId: string;
        readonly callId: string;
    };
    /** The session this one replaced, when eve started it in place of a stranded one. */
    readonly predecessor?: SessionPredecessor;
    readonly runtime?: RuntimeIdentity;
    readonly trace?: TraceContext;
}): Transition;
/**
 * Deliveries join the open turn without opening one, as answers do.
 * Between turns an answer has nothing to join: it took effect, and settles `applied`. A delivery
 * already settled, such as one refused, joins nothing.
 */
export declare function join(view: SessionView, input: {
    readonly deliveries: readonly ConsumedDelivery[];
}): Transition;
/** The turn completes: it settles with the reply its parts made. */
export declare function complete(view: SessionView): Transition;
/**
 * An interrupted attempt that finished clearing the session: its history empties now, and nothing
 * it suspended or a sign-in held stays. What it remembered of approvals does.
 */
export declare function clearedByAttempt(view: SessionView): Transition;
/**
 * The step failed. A recoverable failure leaves the session for the user to retry; a terminal
 * one ends it.
 */
export declare function fail(view: SessionView, failure: {
    readonly code: string;
    readonly details?: JsonObject;
    readonly message: string;
    readonly terminal?: true;
}): Transition;
/** One call's result, ready for its step's transcript. */
export interface SettledCall {
    readonly part: ToolResultPart;
    /** A runtime result, reported at the coordinates of the step that made the call. */
    readonly result?: RuntimeActionResult;
    /** What the agent behind the call spent, which its settlement records. */
    readonly usage?: TokenUsage;
}
/**
 * Results reach the steps that made their calls. A step whose every call now has a result
 * commits to history, where the model reads it.
 */
export declare function settle(view: SessionView, input: {
    readonly results: readonly SettledCall[];
}): {
    events: SessionEvent[];
    history: HistoryChange;
    turn: TurnState;
} & Transition;
/**
 * A model-call attempt ends without its response reaching history, in one commit with the calls
 * it announced. A retry replaces it: eve can't tell whether those calls ran, so they and the run
 * settle `abandoned`. Steering cut it off: the calls are interrupted, and the run completed what
 * it streamed, with what it spent.
 */
export declare function discardAttempt(view: SessionView, input: {
    readonly runId: string;
    readonly ending: "retried" | "steered";
    readonly usage?: FactOf<"usage.recorded">["data"]["usage"];
}): Transition;
/**
 * A model response made calls the runtime runs. The response waits in a suspended step until
 * every call it made has a result, so a call never reaches the model without its result.
 */
export declare function suspendStep(view: SessionView, step: Pick<SuspendedStep, "event" | "messages" | "tasks">): Transition;
/** The step without the approved calls in `callIds`, which have run or joined the runtime. */
export declare function withoutApproved(step: SuspendedStep, callIds: ReadonlySet<string>): SuspendedStep;
/**
 * The calls of `step` a sign-in stopped that can run: every sign-in each stopped on has called
 * back.
 */
export declare function runnableCalls(view: SessionView, step: SuspendedStep): readonly ApprovedCall[];
/** Private dispatch metadata for a call that starts or reaches a task. */
export interface TaskCallStart {
    readonly clearedBy?: import("#protocol/session-events/families/call.js").ClearedBy;
    readonly callId: string;
    readonly taskId: string;
    readonly turnId: string;
    readonly kind: "agent" | "tool";
    readonly name: string;
}
/** The calls a dispatch started or refused, recorded on the session but not yet published. */
export interface PendingDispatch {
    /** Calls the turn waits on, each running from now in a run of its own. */
    readonly executing: readonly {
        readonly callId: string;
        readonly clearedBy?: import("#protocol/session-events/families/call.js").ClearedBy;
    }[];
    /** Tasks the dispatch started or sent a call to. */
    readonly started: readonly TaskCallStart[];
    /** Calls a dispatch admission refused before any run started, and the policy that refused. */
    readonly refused: readonly {
        readonly result: RuntimeActionResult;
        readonly policy: string;
    }[];
}
/**
 * What a dispatch recorded, published as one commit: the calls the turn waits on started, the
 * tasks it started or reached, and the calls it refused.
 */
export declare function startDispatchedCalls(view: SessionView, pending: PendingDispatch): Transition;
/** A task starts once; every call it serves starts against that task. */
export declare function startTask(view: SessionView, task: TaskCallStart, introducedTasks?: Set<string>): Transition;
export type TaskCallOutcome = {
    readonly status: "completed";
    readonly output?: JsonValue;
} | {
    readonly status: "failed";
    readonly error: string;
} | {
    readonly status: "cancelled";
    readonly reason?: TaskCancelReason;
};
/** A task's run settled calls: each reports its outcome, naming the task as it started. */
export declare function settleTask(view: SessionView, input: {
    readonly calls: readonly {
        readonly callId: string;
    }[];
    readonly outcome: TaskCallOutcome;
}): Transition;
/** A task's body ended. Replying only settles calls; it never ends a resumable task. */
export declare function endTask(view: SessionView, input: {
    readonly taskId: string;
    readonly outcome: TaskCallOutcome;
}): Transition;
/**
 * A task or workflow run ended, on its own or cancelled: nobody can answer what it relayed, so
 * each request still open is withdrawn.
 */
export declare function finishRun(view: SessionView, run: {
    readonly taskId?: string;
    readonly requestIds?: Iterable<string>;
}): Transition;
/**
 * A child session or workflow run relays one of its interaction facts. The session mirrors each
 * as its own interaction, about the call it serves, with the asker as its origin: a request
 * opens, and records where its answers go; the asker's settlement closes it; and the asker's
 * admission or refusal of an answer this session forwarded applies to the forwarded copy. The
 * open turn waits on a request about one of its calls; a task's request waits on the task.
 */
export declare function relay(view: SessionView, input: {
    readonly payload: SubagentInteractionHookPayload;
    /** The workflow tool run that relays the request, and the hook its `ctx.ask()` answers reach. */
    readonly runId?: string;
    readonly workflowAsk?: WorkflowAskRoute;
}): Transition;
/**
 * Answers to requests this session relays went on to their askers. Each delivery that carried
 * such answers is admitted here, with the answers it forwarded. An answer joins the open turn
 * that asked; a delivery that also carries input for this session goes on to its turn. Between
 * turns, forwarding alone applies the delivery. A question this session decides settles now; an
 * approval stays open until its asker settles it.
 */
export declare function routeAnswer(view: SessionView, input: {
    readonly deliveries: readonly {
        readonly deliveryId: string;
        readonly principal?: Principal;
        readonly source?: DeliverySource;
        /** The open asking turn consumes the answer, with any message parts it carried. */
        readonly consumed?: {
            readonly turnId: string;
            readonly parts: readonly UserPart[];
        };
        /** The delivery also carries input for this session, whose turn consumes and settles it. */
        readonly continues?: true;
    }[];
    /** Every answer forwarded, as admitted. */
    readonly forwarded: readonly ResponseSubmittedData[];
    /**
     * Relayed requests this session settles as it forwards their answer, because nobody else
     * will before it acts: a workflow run's `ctx.ask()` question, since a run publishes nothing of
     * its own, and a child's budget prompt this session stops on, since Stop ends its own turn.
     */
    readonly decided: readonly {
        readonly answer: Answer;
        readonly outcome: "accepted" | "declined";
    }[];
}): Transition;
/**
 * Sign-in callbacks matched the attempts `attemptIds` name: the session stops waiting on them.
 * A call they stopped runs once every sign-in it waits on has called back (`runnableCalls`); any
 * other completion reports once the turn it resumes runs (`completeSignIn`).
 */
export declare function matchSignIns(view: SessionView, input: {
    readonly attemptIds: readonly string[];
}): Transition;
/** The sign-ins calls stopped on, which the calls report when they settle. */
export declare function callSignIns(turn: TurnState): readonly AuthorizationChallenge[];
/**
 * The `stopped` calls wait for a sign-in: their results leave the step, and they stay approved and
 * open, to run once the sign-ins call back, rather than the model asking for them again.
 */
export declare function awaitSignIns(step: SuspendedStep, input: {
    readonly stopped: readonly StoppedCall[];
    readonly challenges: readonly AuthorizationChallenge[];
}): SuspendedStep;
/**
 * A call a sign-in stopped settled: the sign-ins it waited on end with it, accepted if it returned
 * and failed with the reason it didn't. A failure with `retryable: false` is terminal, recorded as
 * the settlement's `response.retryable`. Published before the call's own settlement.
 */
export declare function callSignInsSettled(view: Pick<SessionView, "projection">, call: ApprovedCall, failure?: {
    readonly reason?: string;
    readonly retryable?: boolean;
}): SessionEvent[];
/**
 * Sign-in callbacks arrived: each attempt the session still waits on is accepted. A sign-in a
 * call stopped on settles with the call instead (`callSignInsSettled`).
 */
export declare function completeSignIn(view: SessionView, input: {
    readonly completions: readonly AuthorizationChallenge[];
}): Transition;
/**
 * The delivery a clear or compact arrived as. One that names none, from a caller that predates
 * control ids, is named by the position it applies at.
 */
export declare function controlDeliveryFor(view: SessionView, given?: ControlDelivery): ControlDelivery;
/**
 * A control's transition as a delivery: admitted before what it changes and applied after, in
 * the same commit, with what it changes naming it as the cause. A control that names no
 * delivery changes the session on its own.
 */
export declare function controlled(delivery: ControlDelivery | undefined, control: string, build: (cause: Cause | undefined) => Transition): Transition;
/** What the model reads for a call its turn's cancellation stopped before the call settled. */
export declare const CANCELLED_CALL_RESULT = "The turn was cancelled before this call finished.";
/**
 * `session.cancel()`: the open turn ends cancelled. Its requests, its sign-ins, and every
 * relayed request are withdrawn, since the cancel stops the work that asked them; its unsettled
 * calls are stopped. The steps it ran commit to history, each unfinished call answered as
 * cancelled, so the model sees that the work started and stopped.
 */
export declare function cancel(view: SessionView, input?: {
    readonly cause?: Cause;
}): Transition;
/**
 * A step was interrupted after it published, and its retry runs from the checkpoint before it.
 * Each step waiting on what the interrupted attempt did, an answer it applied or a call it
 * started, can't resume from it again: the step stops, each call it made answered with what the
 * stream says of it, so none runs again. The events the attempt wrote already say what changed.
 */
export declare function stopInterruptedSteps(view: SessionView, input: {
    readonly calls: ReadonlyMap<string, InterruptedCall>;
    readonly settledInteractions: ReadonlySet<string>;
}): Transition;
/**
 * `session.clear()`: everything the cleared history asked for is withdrawn, its approvals and
 * the session-limit prompt and every sign-in, and the calls awaiting them stop. A clear cancels
 * the running turn and the session's working tasks first, and a task run withdraws what it
 * relayed as it stops, so relayed requests are left to it.
 */
export declare function clear(view: SessionView, input?: {
    readonly cause?: Cause;
}): Transition;
