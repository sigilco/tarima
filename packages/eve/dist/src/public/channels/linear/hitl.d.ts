import type { Interaction } from "#channel/interaction-prompts.js";
import type { JsonObject } from "#shared/json.js";
/** Renders eve input requests as one user-visible Linear elicitation body. */
export declare function renderLinearInteractions(requests: readonly Interaction[]): string;
/** Builds native Linear select metadata for a single input request with options. */
export declare function linearInteractionSignal(requests: readonly Interaction[]): {
    readonly signal?: "select";
    readonly signalMetadata?: JsonObject;
};
