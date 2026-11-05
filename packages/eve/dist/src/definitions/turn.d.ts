import type { DynamicTurn } from "#dynamic/definition.js";
import type { UserPart } from "#protocol/session-events/envelope.js";
import type { SessionView, TurnRow } from "#protocol/session-projection/tables.js";
/** The session's latest turn, from its tables alone, so it reads the same in every step. */
export declare function latestTurn(view: SessionView): DynamicTurn | null;
/**
 * The parts a turn opened with: its cause, and the deliveries admitted before it started, which it
 * consumed together. One admitted after it started steers it, and isn't its input.
 */
export declare function turnInput(view: SessionView, row: TurnRow): readonly UserPart[];
/** The text of a turn's input. */
export declare function turnInputText(turn: DynamicTurn): string;
