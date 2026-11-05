import type { CompiledAgentManifest } from "#compiler/manifest.js";
import { type SkillFileSource } from "#channel/skill-files.js";
import { type RuntimeCompiledArtifactsSource } from "#runtime/compiled-artifacts-source.js";
import type { JsonObject } from "#shared/json.js";
/** One compiled tool a caller can invoke outside a turn. */
export interface AgentToolDescription {
    readonly name: string;
    readonly description: string;
    readonly inputSchema: JsonObject;
    readonly outputSchema?: JsonObject;
    /** The tool declares an approval policy. */
    readonly approval: boolean;
}
/** One file of a skill, as `listSkillFiles` returns it. `readSkill` rejects files over 512 KiB. */
export interface AgentSkillFileDescription {
    /** `/`-separated path under the skill root, e.g. `references/api.md`. */
    readonly path: string;
    /** Size in bytes. */
    readonly size: number;
}
/** One compiled skill. `listSkillFiles` enumerates its files. */
export interface AgentSkillDescription {
    readonly name: string;
    readonly description: string;
}
/**
 * The caller-facing view of an agent: its name, description, the compiled
 * tools `invokeTool` can run, and its compiled skills, each sorted by name.
 * Unlike `GET /eve/v1/info`, it carries no paths, config, diagnostics, or
 * other inspection detail, so channels can publish it as is. Tools and
 * skills added by dynamic resolvers and subagents are not listed.
 */
export interface AgentDescription {
    readonly name: string;
    readonly description?: string;
    readonly tools: readonly AgentToolDescription[];
    readonly skills: readonly AgentSkillDescription[];
}
/** The `describe`, `listSkillFiles`, and `readSkill` route handler args. */
export interface AgentDescriptionRouteArgs {
    describe(): Promise<AgentDescription>;
    listSkillFiles(skill: string): Promise<readonly AgentSkillFileDescription[]>;
    readSkill(skill: string, path?: string): Promise<Uint8Array>;
}
/**
 * One compiled agent as its routes see it: the description projected from
 * its manifest, and the source of its skill files. Loading it reads the
 * manifest only; no skill file is touched until one is listed or read.
 */
export interface DescribedAgent {
    readonly description: AgentDescription;
    readonly files: SkillFileSource;
}
/**
 * Loads the agent of a compiled artifacts source once per artifact version
 * on the active runtime session, as `getCompiledRuntimeAgentBundle` does for
 * the execution graph, without resolving that graph. A production build
 * loads once per process; `eve dev` reloads after each recompile. A failed
 * load is retried on the next call rather than cached.
 */
export declare function loadDescribedAgent(compiledArtifactsSource: RuntimeCompiledArtifactsSource): Promise<DescribedAgent>;
/**
 * The agent route handler args for one compiled artifacts source, which
 * resolves on first use so routes that never call them pay nothing. Also
 * returns the agent's skill files, so a channel that already holds listed
 * paths reads them without the listing `readSkill` repeats per call.
 */
export declare function createAgentDescriptionRouteArgs(resolveCompiledArtifactsSource: () => RuntimeCompiledArtifactsSource): {
    readonly args: AgentDescriptionRouteArgs;
    readonly skillFiles: SkillFileSource;
};
/** Projects the root node of a compiled manifest onto {@link AgentDescription}. */
export declare function describeCompiledAgent(manifest: CompiledAgentManifest): AgentDescription;
