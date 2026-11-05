import type { Plugin } from "rolldown";
export interface AuthoredPluginsInput {
    /** The authored package: asset imports stay inside it, and its tsconfig resolves aliases. */
    readonly packageRoot: string;
    /**
     * For builds that also bundle installed dependencies, the workflow driver
     * and the Nitro host: eve resolves imports from authored source only and
     * leaves dependency imports to the bundler.
     */
    readonly authoredSourceOnly?: boolean;
    /**
     * With `authoredSourceOnly`, installed packages that generated bundles imported and left for
     * this build. They and the packages they load keep the asset, extension, and package-local
     * tsconfig `paths` resolution that inlining them into those bundles would have applied.
     */
    readonly hostBundledPackageRoots?: readonly string[];
    readonly extensions?: readonly string[];
}
/**
 * How every eve build resolves authored source: authored module bundles,
 * extension distributions, the workflow driver, and the Nitro host. Callers
 * put their own plugins around this list, never inside it.
 */
export declare function createAuthoredPlugins(input: AuthoredPluginsInput): Plugin[];
/**
 * The one tsconfig every build of the authored package reads: its own
 * `tsconfig.json` or `jsconfig.json`. Sources in other workspace packages get
 * their own package's `paths` from {@link createAuthoredPlugins}.
 */
export declare function resolveAuthoredTsConfigPath(packageRoot: string): string | false;
