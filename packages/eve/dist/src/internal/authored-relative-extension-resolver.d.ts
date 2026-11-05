import type { Plugin } from "rolldown";
/**
 * Resolves extensionless path imports before Rolldown's default resolver.
 */
export declare function createAuthoredRelativeExtensionResolverPlugin(input: {
    /** Leaves imports from installed dependencies to the bundler. */
    readonly authoredSourceOnly?: boolean;
    readonly extensions: readonly string[];
    /** With `authoredSourceOnly`, installed importers to handle anyway. */
    readonly handlesInstalledModule?: (path: string) => boolean;
}): Plugin;
