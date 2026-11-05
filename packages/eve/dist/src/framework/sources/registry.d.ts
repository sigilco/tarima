import { type AgentSourceRegistry, type AgentModuleBacking, type ProgrammaticModuleNamespace } from "#compiler/source-graph.js";
export declare const frameworkAgentSourceRegistry: AgentSourceRegistry;
export declare function loadFrameworkProgrammaticModule(backing: Extract<AgentModuleBacking, {
    readonly kind: "programmatic";
}>): Promise<ProgrammaticModuleNamespace>;
