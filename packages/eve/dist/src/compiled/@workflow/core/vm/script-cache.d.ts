import { Script } from 'node:vm';
/**
 * Returns a compiled `vm.Script` for the given source code and filename,
 * compiling and caching it on first use. Subsequent calls with the same
 * `(code, filename)` return the cached `Script`.
 *
 * The returned `Script` is not yet bound to any context; the caller runs it
 * against a specific VM context via `script.runInContext(context)`. This is
 * equivalent to `vm.runInContext(code, context, { filename })` but skips the
 * recompile.
 */
export declare function getCachedWorkflowScript(code: string, filename: string): {
    script: Script;
    cacheHit: boolean;
};
/**
 * Clears the compiled-script cache. Intended for tests that want to assert
 * compile-vs-cache behaviour in isolation; not used on the hot path.
 */
export declare function clearWorkflowScriptCache(): void;
/**
 * Number of distinct script source strings currently retained. Exposed for
 * tests asserting the LRU bound; not used on the hot path.
 */
export declare function workflowScriptCacheSize(): number;
//# sourceMappingURL=script-cache.d.ts.map