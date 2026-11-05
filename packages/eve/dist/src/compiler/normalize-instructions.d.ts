import type { InstructionsSourceRef } from "#discover/manifest.js";
import type { CompiledDefinition, CompiledInstructionsDefinition } from "#compiler/manifest.js";
import { type SourceDefinitionCompileOptions } from "#compiler/normalize-helpers.js";
/**
 * Compiled instructions entry produced from one authored `instructions/*`
 * file or flat `instructions.{md,ts,...}`.
 *
 * Either a static instructions definition or a dynamic resolver that
 * produces model messages at runtime.
 */
type CompiledInstructionsEntry = {
    readonly kind: "instructions";
    readonly definition: CompiledInstructionsDefinition;
} | {
    readonly kind: "dynamic";
    readonly definition: CompiledDefinition;
};
/**
 * Compiles one authored instructions prompt source (markdown or
 * module-backed `defineInstructions`) into the normalized shape consumed
 * by the runtime.
 *
 * Module-backed static instructions sources execute once at build time —
 * the resulting content is captured into the compiled manifest. There is
 * no per-session re-evaluation at runtime.
 *
 * Module-backed dynamic instructions (exporting `defineDynamic`) are
 * classified and their event names recorded; the resolver runs at
 * runtime.
 */
export declare function compileInstructionsEntry(_agentRoot: string, source: InstructionsSourceRef, options: SourceDefinitionCompileOptions): Promise<CompiledInstructionsEntry>;
export {};
