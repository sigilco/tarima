import type { AlsContext } from "#context/container.js";
import type { ResolvedDynamicDefinition } from "#runtime/types.js";
import { type Definition } from "./definition.js";
/**
 * The agent's static instructions: its system instructions as one block of eve's default prompt,
 * and its user instructions announced, as dynamic ones are.
 */
export declare const instructions: Definition;
/** What the agent's workspace holds, where it has one. */
export declare const workspace: Definition;
/**
 * A `defineDynamic()` in `agent/instructions/`. A system instruction is a part of the system
 * prompt of its own while its definition returns it; a user instruction is announced: it joins the
 * conversation when its content changes, and stays there.
 */
export declare function instructionsDefinition(resolver: ResolvedDynamicDefinition<"instructions">): Definition;
/** The agent's static user instructions, each under its announcement's key. */
export declare function staticUserInstructions(container: Pick<AlsContext, "get">): readonly {
    readonly key: string;
    readonly content: string;
}[];
