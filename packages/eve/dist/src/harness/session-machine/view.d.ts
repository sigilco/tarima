import type { ModelMessage } from "ai";
import type { AuthorizationChallenge } from "#harness/authorization.js";
import type { PendingResponder } from "#harness/hitl/index.js";
import { type TaskToolCall } from "#execution/tasks/calls.js";
import type { SessionStateMap, HarnessStepInput } from "#harness/types.js";
import type { RuntimeWorkflowTaskRequest } from "#shared/action-types.js";
import { type SessionProjection } from "#protocol/session-projection.js";
import { type StepCoordinates, type SuspendedStep, type TurnState } from "./state.js";
export type { ApprovalAsk, ApprovedCall, StepCoordinates, SuspendedStep, TurnState, } from "./state.js";
export declare const SESSION_PROJECTION_STATE_KEY = "eve.harness.sessionProjection";
/** What a transition sees. */
export interface SessionView {
    readonly turn: TurnState;
    readonly projection: SessionProjection;
    /** Requests this session relays for a child session or a workflow run, by `requestId`. */
    readonly relayedRequestIds: ReadonlySet<string>;
    /** Who gave each answer a response policy still weighs, by response id. */
    readonly responders: Readonly<Record<string, PendingResponder>>;
    /** The sign-in attempts the session waits on, with what completing them needs. */
    readonly signIns: readonly AuthorizationChallenge[];
}
/** Reads the authoritative lifecycle facts saved alongside execution state. */
export declare function storedProjection(state: SessionStateMap | undefined): SessionProjection;
/** Coordinates the next lifecycle event carries, and whether a turn is open. */
export interface TurnPosition {
    readonly sessionStarted: boolean;
    readonly sequence: number;
    readonly stepIndex: number;
    /** The open turn's id, or `""` between turns. */
    readonly turnId: string;
    /** The open turn streamed assistant output, so steering can no longer restart it. */
    readonly assistantOutputStarted?: boolean;
    /** The open turn's latest open model run, which content and calls belong to. */
    readonly runId?: string;
}
export declare function turnPosition(projection: SessionProjection): TurnPosition;
/** The open turn's id, or the id the next turn takes. */
export declare function activeTurnId(position: Pick<TurnPosition, "sequence" | "turnId">): string;
export declare function isBetweenTurns(projection: SessionProjection): boolean;
/** Input the session holds until it can run. */
export declare function queuedInput(state: SessionStateMap | undefined): HarnessStepInput | undefined;
export declare function suspendedSteps(state: SessionStateMap | undefined): readonly SuspendedStep[];
/** The ids of calls that already have a result in `messages`. */
export declare function answeredCallIds(messages: readonly ModelMessage[]): ReadonlySet<string>;
/** Workflow and agent calls of `step` the runtime still runs. */
export declare function runningTasks(step: SuspendedStep): readonly RuntimeWorkflowTaskRequest[];
/** What the turn waits on the runtime for: dispatched runs and the task tool calls. */
export interface RuntimeWait {
    readonly event: StepCoordinates;
    readonly callIds: readonly string[];
    readonly tasks: readonly RuntimeWorkflowTaskRequest[];
    readonly taskToolCalls: readonly TaskToolCall[];
}
/** The calls suspended steps wait on the runtime for, or `undefined` when none do. */
export declare function runtimeWait(state: SessionStateMap | undefined): RuntimeWait | undefined;
/** The suspended step whose approval `interactionId` names. */
export declare function stepForRequest(view: SessionView, interactionId: string): SuspendedStep | undefined;
/** Requests this session asked itself and still awaits; relayed requests answer elsewhere. */
export declare function ownOpenRequestIds(view: Omit<SessionView, "turn">): ReadonlySet<string>;
