import type { AgentReasoningDefinition } from "#shared/agent-definition.js";
import type { AgentModelSetting, AgentModelSettingsPatch } from "#source-change/apply-agent-model-settings.js";
export type ApplyModelSettingsOutcome = {
    kind: "changed";
    changed: readonly AgentModelSetting[];
    model?: string;
    reasoning?: AgentReasoningDefinition | null;
    fastMode?: boolean;
} | {
    kind: "unchanged";
} | {
    kind: "rejected";
    message: string;
};
export declare function formatApplyModelSettingsOutcome(outcome: ApplyModelSettingsOutcome): string;
/** The outcome of applying a model slug to the agent's authored source. */
export type ApplyModelOutcome = {
    kind: "changed";
    to: string;
} | {
    kind: "unchanged";
    model: string;
} | {
    kind: "rejected";
    message: string;
};
/** Applies one completed `/model` draft through a single atomic source write. */
export declare function changeAgentModelSettings(input: {
    readonly appRoot: string;
    readonly patch: AgentModelSettingsPatch;
}): Promise<ApplyModelSettingsOutcome>;
/** Applies a validated `/model <slug>` change to authored source. */
export declare function changeAgentModel(input: {
    readonly appRoot: string;
    readonly slug: string;
}): Promise<ApplyModelOutcome>;
/** Applies a selection already confirmed by the provider catalog, retaining source-edit guards. */
export declare function changeValidatedAgentModel(input: {
    readonly appRoot: string;
    readonly slug: string;
}): Promise<ApplyModelOutcome>;
export declare function validateModelSlug(appRoot: string, slug: string): Promise<string | null>;
/** Uses the same source grammar as model edits, never the provider endpoint. */
export declare function readAuthoredModelSelection(startPath: string): Promise<string | undefined>;
