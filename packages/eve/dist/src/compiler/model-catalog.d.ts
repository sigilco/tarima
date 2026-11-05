import { type ModelCatalogEntry, type ModelMetadata } from "#internal/model-catalog.js";
/**
 * Build-time reader of the AI Gateway model catalog. A build reads the catalog through a
 * short-lived disk cache, resolves its static models from it, and bakes the snapshot that
 * runtime model selections use into the compiled artifacts.
 */
export interface CompiledRuntimeModelCatalogLoader {
    getModelLimits(modelId: string): Promise<ModelCatalogEntry | null>;
    getByProviderModelId(provider: string, providerModelId: string): Promise<ModelCatalogEntry | null>;
    /** The snapshot this build ships; empty, with `fetchedAt: null`, when the catalog is unavailable. */
    loadModelMetadata(): Promise<ModelMetadata>;
}
/**
 * Resolves the app-local cache path used for AI Gateway model metadata during
 * compilation.
 */
export declare function resolveCompiledRuntimeModelCatalogCachePath(appRoot: string): string;
/**
 * Creates a per-build loader that caches the AI Gateway model catalog in
 * memory and on disk, with stale-on-error fallback.
 */
export declare function createCompiledRuntimeModelCatalogLoader(appRoot: string): CompiledRuntimeModelCatalogLoader;
