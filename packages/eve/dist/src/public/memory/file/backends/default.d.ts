import type { MemoryDocumentBackend } from "#public/memory/file/backend.js";
/**
 * Selects private Vercel Blob storage on configured Vercel deployments and a
 * shared process-local backend during `eve dev`. All other environments must
 * provide a backend. Selection is deferred and cached per provider instance.
 */
export declare function defaultFileMemoryBackend(): MemoryDocumentBackend;
