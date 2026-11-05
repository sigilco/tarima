import type { LanguageModel, ProviderMetadata } from "ai";
import type { HarnessStepResult } from "#harness/step-hooks.js";
import type { Step } from "#harness/step/context.js";
import type { TokenUsage } from "#shared/token-usage.js";
/** What one model call reported spending; a field it didn't report is absent. */
export type TokenUsageDelta = Partial<TokenUsage>;
/**
 * The model's gateway id, or `undefined` for a model without a string `provider`, such as a
 * test double, so a missing field never throws into the tool loop.
 */
export declare function gatewayModelId(model: LanguageModel): string | undefined;
export declare function extractTokenUsageDelta(input: {
    readonly costUsd: number | undefined;
    readonly usage: HarnessStepResult["usage"] | undefined;
}): TokenUsageDelta | undefined;
export declare function extractGatewayCostUsd(providerMetadata: ProviderMetadata | undefined): number | undefined;
/**
 * Tags the turn's workflow run with the model and what the turn's runs have spent, which their
 * `usage.recorded` facts record. Each model step is its own workflow step and attributes are
 * last-write-wins, so the latest total is what reaches the dashboard. Best-effort: tagging never
 * breaks the loop.
 */
export declare function recordModelUsage(step: Step, input: {
    readonly model: LanguageModel;
    readonly tools: number;
}): Promise<void>;
