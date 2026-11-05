import type { InputOptions, Plugin } from "rolldown";
/** Rolldown options shared by every authored module bundle of one package. */
export declare function createAuthoredModuleBuildOptions(input: {
    readonly packageBoundaryPlugin: Plugin;
    readonly packageRoot: string;
    readonly plugins: readonly (Plugin | null)[];
}): InputOptions;
/**
 * Source maps for bundles evaluated in this process. Node reads inline maps only
 * when source maps are enabled; otherwise V8 retains the map comment as part of
 * every imported module's source text, often most of its size.
 */
export declare function evaluatedBundleSourcemap(): "inline" | false;
