import type { GenerateTextOnStepStartCallback, LanguageModelUsage, ModelMessage, PrepareStepFunction, ProviderMetadata, StepResult, ToolSet, ToolResultPart } from "ai";
import type { Usage } from "#protocol/session-events/envelope.js";
import type { ToolSignIn } from "#harness/call-executor.js";
import type { TurnPosition } from "#harness/session-machine/view.js";
import type { RuntimeModelReference } from "#runtime/agent/bootstrap.js";
import type { ModelProfile } from "#harness/model-profile.js";
import { type HarnessEmitFn, type HarnessSession } from "#harness/types.js";
import type { ApprovalAsk } from "#harness/session-machine/view.js";
/**
 * The subset of `StepResult` that the harness reads after a step completes, captured by the
 * `onStepEnd` callback.
 */
export type HarnessStepResult = Pick<StepResult<ToolSet>, "content" | "finishReason" | "providerMetadata" | "response" | "text" | "toolCalls" | "toolResults" | "usage"> & {
    /** The AI SDK's ID for the model call, which the telemetry of the calls it made shares. */
    readonly callId?: string;
    readonly invalidInputToolCallIds?: ReadonlySet<string>;
    /** The calls eve ran that wait on a person's approval. */
    readonly approvalRequests?: readonly ApprovalAsk[];
    /** The calls eve cleared that the runtime runs, and what cleared each. */
    readonly policyApprovals?: Readonly<Record<string, import("#harness/clearance.js").Clearance>>;
    /** The calls eve ran that stopped for a sign-in. */
    readonly signIns?: readonly ToolSignIn[];
};
/**
 * Input for {@link buildStepHooks}.
 */
interface StepHooksInput {
    readonly auth?: import("#channel/types.js").SessionAuthContext | null;
    /** The model the call runs. */
    readonly model: RuntimeModelReference;
    readonly profile: ModelProfile;
    /**
     * Starts the model step the SDK is about to run. Omitted when the step already started, as
     * it has for a retry of the same step.
     */
    readonly startStep?: (messages: readonly ModelMessage[]) => Promise<void>;
    readonly session: HarnessSession;
}
/**
 * Composable hooks returned by {@link buildStepHooks}.
 */
interface StepHooks {
    /**
     * `ToolLoopAgent` `onStepStart` callback.
     *
     * Starts the step from the prepared step input.
     */
    readonly onStepStart: GenerateTextOnStepStartCallback<ToolSet>;
    /**
     * `ToolLoopAgent` `onStepEnd` callback.
     *
     * Publishes call and content facts from the captured response, then settles its model run
     * with the usage it reported.
     */
    readonly onStepEnd: (step: StepResult<ToolSet>) => Promise<void>;
    /**
     * `ToolLoopAgent` `prepareStep` callback.
     *
     * Handles cache/provider metadata. Compaction happens in the tool-loop
     * before `agent.stream()`.
     */
    readonly prepareStep: PrepareStepFunction<ToolSet>;
    /**
     * Promise that resolves when `onStepEnd` has completed.
     *
     * Await this after consuming the stream to ensure all step events
     * have been emitted before proceeding to post-step handling.
     *
     * Resolves once per hooks instance: a retried model call must rebuild
     * hooks via a fresh `ModelCaller.call` attempt. Re-running a call against
     * hooks whose `stepResult` already resolved reads the previous attempt's
     * result, not the retry's.
     *
     * Never settles when the step does not finish — e.g. the AI SDK's
     * incomplete-stream rejection (`NoOutputGeneratedError`) skips
     * `onStepEnd` entirely. Consumers must surface stream errors as
     * throws before awaiting this promise (`emitStreamContent` does), or
     * the await hangs.
     */
    readonly stepResult: Promise<HarnessStepResult>;
}
/**
 * Builds composable `onStepStart`, `prepareStep`, and `onStepEnd` closures that
 * own all step-internal work: emission, compaction, and prompt caching.
 *
 * The harness passes these hooks to `ToolLoopAgent` and reads the
 * results via `stepResult` after the agent finishes.
 */
export declare function buildStepHooks(input: StepHooksInput): StepHooks;
/**
 * Ends a step's run: the calls that didn't run settle with why, then one commit holds the run's
 * structured result, if it has one, its settlement, and its usage. The stream published the calls,
 * and eve published the results of the calls it ran as they settled.
 */
export declare function emitStepActions(emitFn: HarnessEmitFn, state: TurnPosition, step: HarnessStepResult, notRun: readonly ToolResultPart[]): Promise<void>;
/** A run's usage as `usage.recorded` carries it, or `undefined` when the SDK reported none. */
export declare function runUsageOf(input: {
    readonly costUsd: number | undefined;
    readonly usage: LanguageModelUsage | undefined;
}): Usage | undefined;
export declare function extractGatewayCostUsd(providerMetadata: ProviderMetadata | undefined): number | undefined;
export declare function readGatewayGenerationId(providerMetadata: ProviderMetadata | undefined): string | undefined;
export {};
