/**
 * Writes a content-addressed bundle into the authored-module cache, or marks an
 * existing one as used by this process so {@link pruneAuthoredModuleCache} keeps it.
 */
export declare function writeAuthoredModuleCacheFile(directoryPath: string, fileName: string, code: string): string;
/**
 * Removes cached bundles that no running process can still import. Runs in the
 * background: callers should not await it, and it never rejects.
 */
export declare function pruneAuthoredModuleCache(): Promise<void>;
