import type { RequestSettlement } from "#channel/interaction-prompts.js";
import type { InteractionOption } from "#protocol/session-events/families/interaction.js";
type PromptOption = Pick<InteractionOption, "id" | "label">;
/**
 * How eve resolved a posted prompt, such as `Approved` or a chosen option's
 * label. A request that ends without an answer, such as one withdrawn when its
 * turn is cancelled, is no longer needed.
 */
export declare function resolvedPromptAnswer(resolution: RequestSettlement, options?: readonly PromptOption[]): string | undefined;
/** The line a prompt shows once resolved, such as `Approved` or `Answered: Saturday`. */
export declare function resolvedPromptLabel(resolution: RequestSettlement, options?: readonly PromptOption[]): string;
/** A question or budget prompt someone answered. */
export declare function isAnswered(resolution: RequestSettlement): boolean;
export {};
