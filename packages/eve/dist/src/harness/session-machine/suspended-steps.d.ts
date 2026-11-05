import type { ModelMessage } from "ai";
import type { SuspendedStep, TurnState } from "./state.js";
type ToolResponsePart = Extract<ModelMessage, {
    role: "tool";
}>["content"][number];
export type ToolResultPart = Extract<ToolResponsePart, {
    type: "tool-result";
}>;
/** The turn with `step` suspended after the steps it already holds. */
export declare function suspend(turn: TurnState, step: SuspendedStep): TurnState;
/** The ids of the calls a step's response made, except provider-executed ones. */
export declare function stepCallIds(step: Pick<SuspendedStep, "messages">): ReadonlySet<string>;
/** Every call the step made has a result: a pending approval's call has none yet. */
export declare function isComplete(step: SuspendedStep): boolean;
/**
 * Places a result right after the message that made its call, under the call's name: a call
 * made through `eve__tool` or `eve__skill` keeps that name in history, whatever entry it ran.
 */
export declare function withResult(messages: readonly ModelMessage[], result: ToolResultPart): ModelMessage[];
/** The messages without the results of the calls in `callIds`, which stay as unanswered calls. */
export declare function withoutResults(messages: readonly ModelMessage[], callIds: ReadonlySet<string>): ModelMessage[];
export {};
