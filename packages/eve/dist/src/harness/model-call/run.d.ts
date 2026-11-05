import type { StepCatalog } from "#execution/catalog/step-catalog.js";
import type { GenerationSteering } from "#harness/generation-steering.js";
import { type HarnessModelMessage } from "#harness/messages.js";
import { type Step } from "#harness/step/context.js";
import type { TurnInput } from "#harness/step/intake.js";
import type { HarnessStepResult } from "#harness/step-hooks.js";
import type { StepResult } from "#harness/types.js";
import { type EndsTurnTools } from "./tools.js";
/** A model step's response, for the session to act on. */
export interface ModelResponse {
    /** The step's catalog, which decides what each of the response's calls runs. */
    readonly catalog: StepCatalog;
    /** How many prompt messages the model read, when no client context was spliced in. */
    readonly durableModelPromptMessageCount?: number;
    /** Tools that can end the turn in this step, with their `endsTurn` option. */
    readonly endsTurnTools: EndsTurnTools;
    readonly promptMessages: readonly HarnessModelMessage[];
    readonly requestEnvelopeTokens?: number;
    readonly result: HarnessStepResult;
}
/**
 * One model step of the open turn: the prompt it reads, the model that serves it, and the call
 * with its retries and recoveries. The response handler applies what it returned.
 *
 * The session's dynamic values are evaluated first, with the conversation the call reads, which
 * fixes its model, tools, and context. Then the turn's input joins history, so a call that fails
 * keeps it, and the budget gate passes. Then the turn requests a model run, and the run starts as
 * its provider call begins.
 */
export declare function runModelStep(step: Step, input: {
    readonly turn: TurnInput;
    readonly generation: GenerationSteering;
}): Promise<StepResult>;
