/**
 * Bundles a compile's application modules as one code-split graph per set of
 * external dependencies, so a module they share is evaluated once, as in the
 * runtime module map. A module bundled on its own evaluates a private copy of
 * everything it imports.
 */
export interface AuthoredModuleGraph {
    /** Returns the graph entry file for `modulePath`, or `undefined` to bundle it alone. */
    entryPath(modulePath: string, externalDependencies: readonly string[]): Promise<string | undefined>;
}
export declare function createAuthoredModuleGraph(modulePaths: readonly string[], options?: {
    readonly appRoot?: string;
}): AuthoredModuleGraph;
