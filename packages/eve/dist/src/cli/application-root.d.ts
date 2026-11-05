import { type ResolvedDiscoveryProject } from "#discover/project.js";
/** Resolves the nearest enclosing eve application and agent roots. */
export declare function resolveCliApplicationProject(cwd?: string): Promise<ResolvedDiscoveryProject>;
/** Finds the nearest enclosing eve application. */
export declare function findCliApplicationRoot(cwd?: string): Promise<string | undefined>;
