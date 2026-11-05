/**
 * Resolves every local tsconfig/jsconfig file that can affect bundling from
 * one package root: root configs plus their extends chain.
 */
export declare function resolveTsConfigDependencyPaths(appRoot: string): Promise<string[]>;
export declare function readTextFileIfExists(path: string): Promise<string | undefined>;
export declare function parseTsConfigObject(source: string): Record<string, unknown> | undefined;
