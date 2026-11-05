import type { ModelChoice } from "#definitions/model.js";
import type { RuntimeModelReference } from "#runtime/agent/bootstrap.js";
import type { ModelMessage } from "ai";
import type { AlsContext } from "#context/container.js";
import { type HarnessModelMessage } from "#harness/messages.js";
import { type Publish, type Transition } from "#harness/session-machine/commit.js";
import { type StepProjection } from "#harness/session-machine/current.js";
import { type Prompt } from "#harness/step/prompt.js";
import { type SessionView, type TurnPosition } from "#harness/session-machine/view.js";
import type { HarnessEmitFn, HarnessSession, StepFn, HarnessStepInput, StepResult, KernelConfig, Commit } from "#harness/types.js";
import type { InstrumentationStepScope } from "#instrumentation/runtime.js";
/**
 * One harness step: the session it changes, and the machine it changes the session through.
 * Every lifecycle change goes through `apply`, which publishes the transition's events and saves
 * what it changed; `position` reads where those events left the session.
 */
export interface Step {
    session: HarnessSession;
    /** The model the step's call runs, once eve has chosen it for the call. */
    model?: ModelChoice;
    frameworkToolNames: ReadonlySet<string>;
    readonly config: KernelConfig;
    /** The session's context. */
    readonly ctx: AlsContext;
    readonly runStep: StepFn;
    readonly publish: Publish;
    /** The caller's event handler. Without one, a failure throws instead of being reported. */
    readonly emit: HarnessEmitFn | undefined;
    readonly instrumentation: InstrumentationStepScope<HarnessSession> | undefined;
    /** A child's caller or a schedule hears only the turn's real end. */
    readonly hasDelegatedCaller: boolean;
    /**
     * The session's reader sees only its final reply: a child's caller or a schedule. A held turn's
     * text there narrates; a person reads it as a reply.
     */
    readonly finalReplyOnly: boolean;
    /** A tool's `endsTurn` applies: a root turn without an output schema. */
    readonly endsTurn: boolean;
    view(): SessionView;
    position(): TurnPosition;
    /** Publishes a transition, or kernel facts that change nothing private, as one commit. */
    apply(change: Transition | Commit, messages?: readonly ModelMessage[]): Promise<void>;
}
/** The model the step's call runs. Read only once eve has chosen it for the call. */
export declare function stepReference(step: Pick<Step, "model">): RuntimeModelReference;
export declare function createStep(input: {
    readonly config: KernelConfig;
    readonly ctx: AlsContext;
    readonly emit: HarnessEmitFn | undefined;
    readonly instrumentation: InstrumentationStepScope<HarnessSession> | undefined;
    readonly live: StepProjection;
    readonly publish: Publish;
    readonly runStep: StepFn;
    readonly session: HarnessSession;
}): Step;
/** Opens the turn, or joins the open one. Returns the step's result when opening failed the session. */
export declare function openTurn(step: Step, opened: {
    readonly input: readonly HarnessModelMessage[];
    readonly message?: HarnessStepInput["message"];
    /** The deliveries the turn consumes. */
    readonly deliveries?: HarnessStepInput["deliveries"];
}): Promise<StepResult | undefined>;
/**
 * Before a model call: the session's dynamic values are evaluated with the conversation the call
 * reads. A value that fails fails the turn; returns the step's result then.
 */
export declare function prepareModelCall(step: Step, preview: Prompt): Promise<StepResult | undefined>;
/** A hook failed during the turn: the turn fails. Returns the step's result then. */
export declare function failTurnForEffect(step: Step): Promise<StepResult | undefined>;
/** A lifecycle event failed to publish: a dynamic model selection failure ends the session. */
export declare function failBoundaryEvent(step: Step, error: unknown): Promise<StepResult>;
/** No model can serve the turn: the session fails. */
export declare function failModelSelection(step: Step, error: unknown): Promise<StepResult>;
