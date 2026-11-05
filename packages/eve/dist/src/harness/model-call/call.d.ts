import type { ApprovalMemory } from "#approval/evaluation.js";
import { type LanguageModel, type ModelMessage } from "ai";
import type { StepCatalog } from "#execution/catalog/step-catalog.js";
import type { GenerationSteering } from "#harness/generation-steering.js";
import type { HarnessModelMessage } from "#harness/messages.js";
import { type ModelProfile } from "#harness/model-profile.js";
import type { Step } from "#harness/step/context.js";
import { type Prompt } from "#harness/step/prompt.js";
import { type HarnessStepResult } from "#harness/step-hooks.js";
import type { StepResult } from "#harness/types.js";
import { type RequestMessages } from "./request.js";
/** How one attempt differs from the step's first: what recovery and retries change. */
export interface ModelCallOptions {
    readonly disabledProviderTools?: ReadonlySet<string>;
    readonly extraSystemNote?: string;
    readonly retryReason?: "empty-response";
    readonly trailingUserNote?: string;
}
/** What a model step's caller needs from the step. */
interface ModelCallerInput {
    /** The step's catalog: what the model can call, and what each call runs. */
    readonly catalog: StepCatalog;
    readonly model: LanguageModel;
    readonly generation: GenerationSteering;
    readonly turnMessages: readonly HarnessModelMessage[];
    readonly approvalMemory: ApprovalMemory;
    /** The prompt as the step started it, projected for the model. */
    readonly projectedMessages: HarnessModelMessage[];
    /** Requests a run to replace one an attempt gave up. */
    readonly newRun: () => Promise<void>;
    /** Starts an attempt at the run as its provider call begins, once any compaction settled. */
    readonly startRun: (attempt: number) => Promise<void>;
}
/**
 * Calls the model for one step. Each attempt rebuilds the tools, the request, and the agent, so an
 * earlier stream can't resolve a retry's one-shot step hooks with stale partial output. An attempt
 * may first compact the prompt, which rewrites the durable messages the step later commits.
 */
export declare class ModelCaller {
    readonly profile: ModelProfile;
    private readonly attributionHeaders;
    /** The prompt as the model reads it, projected for its history view. */
    private projectedMessages;
    /** The step's announcements go before the first of these the prompt has. */
    private turnMessages;
    /** The latest attempt's request; its history is what the step commits. */
    request: RequestMessages;
    /** The messages the latest attempt sent, after attachments were hydrated. */
    modelMessages: ModelMessage[];
    requestEnvelopeTokens: number;
    /** The step's system prompt, from its harness's plan. */
    private system;
    /** Usage of a call steering interrupted, which the steered step still counts. */
    private interruptedUsage;
    private compactionFailure;
    /** Tries at this model step, across the runs a retry after output replaced. */
    private attemptIndex;
    /** The attempt the stream last heard start, until it hears how it ended. */
    private started;
    /** The latest attempt published output, so retrying it gives its run up. */
    private acceptedOutput;
    private readonly step;
    private readonly prompt;
    private readonly input;
    constructor(step: Step, prompt: Prompt, input: ModelCallerInput);
    /** Calls the model, retrying transient failures. */
    call(): Promise<HarnessStepResult>;
    /**
     * Once a failed attempt will be tried again. One that published output gives its run up for a
     * new one: the calls it announced settle `abandoned`, since eve can't tell whether they ran. One
     * that published nothing retries in the same run, and the stream hears why.
     */
    private prepareRetry;
    /**
     * A failed compaction fails the step, whatever recovery the call attempted.
     * One that left the history over the limit ends the session with its message;
     * any other failure is reported like a failed model call, since its summary
     * call already retried. Rethrowing would make the workflow replay the step and
     * then end the session.
     */
    failIfCompactionFailed(): Promise<StepResult | undefined>;
    /** Steering interrupted the call: the step ends with what it committed, and runs again. */
    steered(): Promise<StepResult>;
    /** The step's result counted its usage, so an interrupted call's usage no longer applies. */
    clearInterruptedUsage(): void;
    /** The call's system prompt and messages, from the step's harness. */
    private buildRequest;
    /**
     * The call's instructions and messages, with the attempt's notes. A trailing user note keeps the
     * provider's cached prefix valid, and the step commits its prompt messages, so the note exists
     * only on this call's request. It would end the request on a user message, which a provider
     * tool's pending result must not follow, so then it joins the system note.
     */
    private framing;
    private prepare;
    /** Asks for the history this call reads, then rebuilds what depends on it. */
    private compact;
    private attempt;
    /**
     * Streams the call, publishing its content as it arrives. `telemetry` is the attempt's, so the
     * calls it runs are traced inside it, as the AI SDK traced the calls it ran.
     */
    private stream;
    /**
     * Runs the response's local calls, unless it ended early: then they don't run, and
     * `answerSkippedToolCalls` tells the model so.
     */
    private runInlineCalls;
}
export {};
