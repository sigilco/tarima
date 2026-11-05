import type { ModelMessage } from "ai";
import type { ContextContainer } from "#context/container.js";
import type { ContextReader } from "#context/key.js";
import { type StepCatalog } from "#execution/catalog/step-catalog.js";
import type { HarnessModelMessage } from "#harness/messages.js";
import type { SessionView } from "#harness/session-machine/view.js";
import type { HarnessSession, HarnessToolMap } from "#harness/types.js";
import { type CallInput, type CallRecord, type Draft } from "./definition.js";
import { type ModelChoice } from "./model.js";
/** What a step's definitions read: a `Step`, or the parts of one a test builds. */
export interface StepSource {
    readonly config: {
        readonly tools: HarnessToolMap;
    };
    readonly ctx: ContextReader;
    readonly finalReplyOnly: boolean;
    /** A tool's `endsTurn` applies, which its description then says; `false` where omitted. */
    readonly endsTurn?: boolean;
    readonly session: Pick<HarnessSession, "rootSessionId">;
    readonly view?: () => SessionView;
}
/** The step's model call as its definitions make it. */
export declare function stepDraft(step: StepSource, call?: CallInput): Promise<Draft>;
/** What a model call's values evaluate with: the conversation it reads. */
export interface ValueRun {
    readonly abortSignal?: AbortSignal;
    readonly conversation: readonly ModelMessage[];
}
/**
 * Before a model call: evaluates what the step's definitions keep, as the call reads it, each
 * once, with the conversation the call reads. The model first: every other value may read it. A
 * part of the call a later definition replaces evaluates nothing under it.
 */
export declare function evaluateStepValues(step: StepSource, run: ValueRun): Promise<void>;
/** The model the step's call runs, as its definitions last chose it. */
export declare function stepModel(step: StepSource): Promise<ModelChoice | undefined>;
/** Evaluates a session's dynamic values as its next model call would, outside a step. */
export declare function evaluateValues(ctx: ContextContainer, run: ValueRun): Promise<void>;
/** The step's catalog: what its definitions offer, as the model's tools and what each call runs. */
export declare function stepCatalog(step: StepSource): Promise<StepCatalog>;
/** The step's system prompt: a string, or parts. */
export declare function stepSystem(step: StepSource, draft?: Draft): Promise<string | readonly string[]>;
/**
 * The call's messages: the record the step commits, with what the definitions and the call's
 * tools announce, and what the model reads, which is the record as `project` shows it with each
 * context entry ahead of its turn's input.
 */
export declare function stepMessages(draft: Draft, input: {
    readonly call: CallInput;
    readonly project: (record: readonly HarnessModelMessage[]) => HarnessModelMessage[];
}): Promise<CallRecord & {
    readonly view: readonly HarnessModelMessage[];
}>;
