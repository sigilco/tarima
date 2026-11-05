/** Path of the cross-process lock that serializes writes to one extension's build output. */
export declare function resolveExtensionBuildLockPath(packageRoot: string): string;
/**
 * Runs `callback` while holding a cross-process lock scoped to one extension
 * package. Separate `eve build`, `eve dev`, `withEve`, and `eve extension
 * build` processes can build the same workspace extension, and publication
 * swaps the whole output directory, so concurrent builds must not overlap.
 */
export declare function withExtensionBuildLock<T>(packageRoot: string, callback: () => Promise<T>): Promise<T>;
