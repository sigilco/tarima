import type { MemoryDocumentBackend } from "#public/memory/file/backend.js";
/** Defers environment-sensitive backend selection until its first operation. */
export declare function lazyBackend(resolve: () => MemoryDocumentBackend): MemoryDocumentBackend;
