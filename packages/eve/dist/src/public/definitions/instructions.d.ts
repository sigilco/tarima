import { type DefineDynamic } from "#dynamic/definition.js";
import type { ExactDefinition } from "#public/definitions/exact.js";
import { type PublicInstructionsDefinition } from "#shared/instructions-definition.js";
export type InstructionsDefinition = Readonly<PublicInstructionsDefinition>;
/**
 * Defines instructions in TypeScript from a `{ content, role? }`
 * definition. Omitted `role` defaults to `"system"`.
 *
 * Use it to return instructions from a `defineDynamic` resolver in
 * `agent/instructions/`. For a fixed prompt with no resolver,
 * author `instructions.md` instead. The result is branded so the dynamic
 * instruction lifecycle can validate that a resolver return came through
 * this helper.
 */
export declare function defineInstructions<TInstructions extends InstructionsDefinition>(definition: ExactDefinition<TInstructions, InstructionsDefinition>): TInstructions;
export type DynamicInstructionsResult = InstructionsDefinition | null;
/** `defineDynamic()` for `agent/instructions/`: returns `defineInstructions()` or `null`. */
export declare const defineDynamic: DefineDynamic<DynamicInstructionsResult>;
