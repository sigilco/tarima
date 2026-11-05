import type { Fact, Progress } from "./facts.js";
export type Family = "session" | "delivery" | "turn" | "model" | "content" | "call" | "task" | "interaction" | "response" | "child" | "context" | "usage";
/**
 * A fact's role in its family's lifecycle: it introduces an entity, updates an open one, ends it,
 * introduces and ends it at once (a content part), or records something with no lifecycle.
 */
export type FactRole = "introduces" | "updates" | "terminal" | "complete" | "record";
export interface FactDescriptor {
    readonly family: Family;
    readonly role: FactRole;
    /** The payload field that names the entity the fact is about. */
    readonly idField: string;
}
export declare const SESSION_OUTCOMES: readonly ["completed", "failed"];
export declare const DELIVERY_OUTCOMES: readonly ["handled", "awaiting-input", "applied", "ignored", "refused", "failed"];
export declare const TURN_OUTCOMES: readonly ["completed", "failed", "cancelled"];
export declare const MODEL_OUTCOMES: readonly ["completed", "failed", "interrupted", "abandoned"];
export declare const CALL_OUTCOMES: readonly ["completed", "failed", "rejected", "interrupted", "abandoned"];
export declare const TASK_OUTCOMES: readonly ["completed", "failed", "cancelled"];
export declare const INTERACTION_OUTCOMES: readonly ["accepted", "declined", "invalid", "failed", "withdrawn", "interrupted", "abandoned", "expired"];
export declare const RESPONSE_OUTCOMES: readonly ["applied", "refused", "failed", "withdrawn", "abandoned", "expired"];
export declare const CONTEXT_OUTCOMES: readonly ["completed", "failed", "cancelled", "interrupted"];
type TerminalType = Extract<Fact["type"], `${string}.${"ended" | "settled"}`>;
/** Each terminal's closed outcome set. A value outside it is a contract violation. */
export declare const TERMINAL_OUTCOMES: {
    readonly [TType in TerminalType]: readonly string[];
};
export declare const FACT_CATALOG: {
    readonly [TType in Fact["type"]]: FactDescriptor;
};
export interface ProgressDescriptor {
    readonly family: Family;
    readonly idField: string;
}
export declare const PROGRESS_CATALOG: {
    readonly [TType in Progress["type"]]: ProgressDescriptor;
};
export type FactType = Fact["type"];
export type ProgressType = Progress["type"];
/** True for a fact type this version knows. Readers ignore the others. */
export declare function isFactType(type: unknown): type is FactType;
/** True for a progress type this version knows. Readers ignore the others. */
export declare function isProgressType(type: unknown): type is ProgressType;
/** True for a terminal fact type. */
export declare function isTerminalType(type: unknown): type is TerminalType;
/** True when a terminal's outcome belongs to its closed set. */
export declare function isKnownOutcome(type: TerminalType, outcome: unknown): boolean;
/** A content part's phase, with unknown values read as narration. */
export declare function contentPhase(phase: unknown): "narration" | "reply";
export {};
