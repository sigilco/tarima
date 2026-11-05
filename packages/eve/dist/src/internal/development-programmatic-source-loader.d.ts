import { type AgentModuleBacking, type ProgrammaticModuleNamespace } from "#compiler/source-graph.js";
/** Loads framework and development-extension programmatic modules for local dev maps. */
export declare function loadFrameworkProgrammaticModule(backing: Extract<AgentModuleBacking, {
    readonly kind: "programmatic";
}>): Promise<ProgrammaticModuleNamespace>;
export { memoizeModuleNamespaceFactories } from "#compiler/source-graph.js";
export { interopAuthoredModuleNamespace } from "#internal/authored-module.js";
