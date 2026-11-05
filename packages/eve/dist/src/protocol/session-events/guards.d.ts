import type { FactOf } from "./facts.js";
type TerminalFact = FactOf<"session.ended" | "delivery.settled" | "turn.settled" | "model.settled" | "call.settled" | "task.ended" | "interaction.settled" | "response.settled" | "context.settled">;
/** True for a fact that ends its entity. */
export declare function isTerminal(fact: {
    readonly type: string;
}): fact is TerminalFact;
/** True for a terminal fact that ended its entity normally. */
export declare function isCompleted(fact: {
    readonly type: string;
}): boolean;
export {};
