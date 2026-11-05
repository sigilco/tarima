/** A package found on disk, or a declared dependency that isn't installed (empty `root`). */
export interface InstalledPackage {
    readonly name: string | undefined;
    readonly root: string;
}
/** The packages at `packageRoots` and every package they can load, as installed on disk. */
export declare function installedDependencyClosure(packageRoots: readonly string[]): readonly InstalledPackage[];
/**
 * Whether a module path sits inside one of `packageRoots` or a package they can load. Builds the
 * closure once, on the first call, and caches each directory's answer.
 */
export declare function createInstalledPackageScope(packageRoots: readonly string[]): (modulePath: string) => boolean;
/** The nearest enclosing directory whose package.json names a package, skipping nested stubs. */
export declare function installedPackageRoot(filePath: string): string | undefined;
