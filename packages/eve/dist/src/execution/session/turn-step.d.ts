import type { TurnStepInput, TurnStepResult } from "#execution/session/turn-step-types.js";
export type { TurnStepInput };
/** Runs a bounded batch of harness model steps inside one durable `"use step"` boundary. */
export declare function turnStep(input: TurnStepInput): Promise<TurnStepResult>;
