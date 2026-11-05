import { type HarnessModelMessage } from "#harness/messages.js";
import { getTurnClientContextState } from "#harness/turn-client-context.js";
import type { Step } from "./context.js";
import { type TurnInput } from "./intake.js";
type ClientContext = NonNullable<ReturnType<typeof getTurnClientContextState>>;
/**
 * What the model reads this step: durable history, which holds the turn's input, with the task
 * results the step delivers, and the client's context for the turn, which keeps one position
 * across the turn's steps and never joins history.
 */
export interface Prompt {
    /** Durable messages. Compaction may rewrite them. */
    messages: HarnessModelMessage[];
    clientContext: ClientContext | undefined;
}
export declare function buildPrompt(step: Step, turn: TurnInput): Promise<Prompt>;
/**
 * The turn's input joins history before the model call, so a call that fails leaves it there, and
 * the prompt the call reads. The client's context keeps the position it takes here.
 */
export declare function commitTurnInput(step: Step, turn: TurnInput): Promise<Prompt>;
/**
 * The prompt the session's dynamic values are evaluated with: history and the turn's input,
 * without the task results and the client context's position a prompt settles.
 */
export declare function previewPrompt(step: Step, turn: TurnInput): Prompt;
/** `messages`, the prompt's by default, with the client's context at its position. */
export declare function withClientContext(prompt: Prompt, messages?: readonly HarnessModelMessage[]): HarnessModelMessage[];
/** The prompt as the model reads it: with the client's context. */
export declare function projectPrompt(prompt: Prompt): HarnessModelMessage[];
/**
 * Compaction rewrote the durable messages: the client's context keeps its distance from the end,
 * so it stays after the turn's input.
 */
export declare function compactPrompt(step: Step, prompt: Prompt, messages: HarnessModelMessage[]): void;
export {};
