import type { Plugin } from "rolldown";
export declare const RESOLVE_EXTENSIONS: readonly [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".json"];
/** How the host treats a generated bundle it bundles again. */
export interface GenerationHostBundle {
    /** The host's traced dependencies; see `collectHostTracedDependencies`. */
    readonly tracedDependencies: readonly string[];
    /**
     * Collects the roots of the installed packages left external, so the host can give them the
     * authored transforms this bundle would have applied, such as asset imports.
     */
    readonly externalPackageRoots: Set<string>;
}
export declare function createGenerationPackageBoundaryPlugin(input: {
    readonly externalDependencies: readonly string[];
    readonly packageRoot: string;
    readonly extensionSpecifiers?: ReadonlySet<string>;
    readonly resolveExternalPaths?: boolean;
    /**
     * Set when the host bundles this output again. Node loads other generations directly, and
     * leaving a CommonJS package external there would lose the bundler's interop for its imports.
     */
    readonly hostBundle?: GenerationHostBundle;
}): Plugin;
export declare function createRuntimeLoaderPackageBoundaryPlugin(input: {
    readonly externalDependencies: readonly string[];
    readonly packageRoot: string;
    readonly extensionSpecifiers?: ReadonlySet<string>;
}): Plugin;
/**
 * Keeps package imports external in an extension distribution while enforcing
 * that every runtime package is declared by the extension.
 */
export declare function createDistributionPackageBoundaryPlugin(input: {
    readonly runtimeDependencies: readonly string[];
    readonly packageRoot: string;
}): Plugin;
export declare function normalizeExternalDependencies(externalDependencies?: readonly string[]): string[];
/** Returns the configured external that `source` imports (the entry itself or one of its subpaths). */
export declare function resolveConfiguredExternalDependency(source: string, externalDependencies: readonly string[]): string | undefined;
/** Returns the package part of a bare specifier: `@acme/db/x` → `@acme/db`, `pg/native` → `pg`. */
export declare function packageImportName(source: string): string;
export declare function isPathImport(source: string): boolean;
export declare function isNodeModulesPath(path: string): boolean;
/** Authored source and workspace packages bundled from source, never installed dependencies. */
export declare function isAuthoredSourcePath(path: string): boolean;
export declare function resolveAuthoredPackageRoot(modulePath: string): string;
/** Returns the nearest directory at or above `directory` that has a `package.json`. */
export declare function findAuthoredPackageRoot(directory: string): string | undefined;
