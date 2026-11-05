import type { Plugin } from "rolldown";
/**
 * Resolves tsconfig `paths` for authored source imported from linked
 * workspace packages. Rolldown handles the root app tsconfig; this only
 * fills the package-local config gap for sources outside the app root.
 */
export declare function createAuthoredPackageTsConfigPathsPlugin(input: {
    appPackageRoot: string;
    /** Leaves imports from installed dependencies to the bundler. */
    authoredSourceOnly?: boolean;
    extensions: readonly string[];
    /** With `authoredSourceOnly`, installed importers to handle anyway. */
    handlesInstalledModule?: (path: string) => boolean;
}): Plugin;
