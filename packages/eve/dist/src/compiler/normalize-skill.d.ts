import type { SkillSourceRef } from "#discover/manifest.js";
import type { CompiledDefinition, CompiledSkillDefinition } from "#compiler/manifest.js";
import { type SourceDefinitionCompileOptions } from "#compiler/normalize-helpers.js";
/**
 * Compiled skill entry produced from one authored `skills/*` file.
 *
 * Either a real skill definition or a dynamic skill resolver that
 * produces skills at runtime.
 */
type CompiledSkillEntry = {
    readonly kind: "skill";
    readonly definition: CompiledSkillDefinition;
} | {
    readonly kind: "dynamic";
    readonly definition: CompiledDefinition;
};
/** Throws when an authored skill takes a name in eve's namespace. */
export declare function assertSkillNameAvailable(skill: {
    readonly logicalPath: string;
    readonly name: string;
}): void;
/**
 * Compiles one authored skill source (markdown, module, or skill
 * package directory) into the normalized shape stored on the compiled
 * agent manifest.
 */
export declare function compileSkillSource(_agentRoot: string, source: SkillSourceRef, options: SourceDefinitionCompileOptions): Promise<CompiledSkillEntry>;
export {};
