import { type LanguageModel } from "ai";
import type { KernelConfig } from "#harness/types.js";
import type { ModelChoice } from "#definitions/model.js";
import type { Step } from "#harness/step/context.js";
import type { ModelProfile } from "#harness/model-profile.js";
/**
 * Builds AI Gateway app attribution headers, including eve's User-Agent product token, for a
 * Gateway-routed model. Direct-provider models receive no Gateway-specific headers.
 */
export declare function buildGatewayAttributionHeaders(profile: ModelProfile, runtimeIdentity: KernelConfig["runtimeIdentity"]): Record<string, string> | undefined;
/** Injects the active model-call context when a Gateway request reaches the provider boundary. */
export declare function withGatewayTraceContext(model: LanguageModel, profile: ModelProfile, createTraceContextHeaders?: () => Record<string, string> | undefined): LanguageModel;
/** The model the step's call runs, as its definitions chose it, and its provider. */
export declare function resolveEffectiveRuntimeModel(step: Step): Promise<{
    readonly choice: ModelChoice;
    readonly model: LanguageModel;
}>;
