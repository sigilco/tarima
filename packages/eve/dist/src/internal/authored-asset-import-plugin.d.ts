import type { Plugin } from "rolldown";
/**
 * Creates the Rollup-compatible plugin that gives authored modules a small
 * asset-module surface for non-code relative imports. An asset may sit outside
 * the agent directory, but not outside the authored package or the package
 * that owns the importing module, such as a workspace package bundled from
 * source.
 */
export declare function createAuthoredAssetImportPlugin(input: {
    readonly packageRoot: string;
    /**
     * Handles only importers and assets outside `node_modules`: authored source
     * and workspace packages bundled from source. Set it for bundles that also
     * bundle dependencies, such as the Nitro server and the workflow driver, so
     * installed dependency imports stay with the host bundler.
     */
    readonly authoredSourceOnly?: boolean;
    /** With `authoredSourceOnly`, installed modules to handle anyway. */
    readonly handlesInstalledModule?: (path: string) => boolean;
}): Plugin;
