import type { ResolvedInstructionsDefinition } from "#runtime/types.js";
/**
 * The agent's static system instructions as one block: the content of every non-empty one, under
 * a single name (the file's, when there's only one of the agent's own).
 */
export declare function agentInstructionsOf(instructions: readonly ResolvedInstructionsDefinition[] | undefined): {
    readonly name: string;
    readonly content: string;
} | undefined;
/** The agent's instructions block in eve's default prompt. */
export declare function renderInstructionsBlock(block: {
    readonly name: string;
    readonly content: string;
}): string;
