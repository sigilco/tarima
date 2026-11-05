import { type MemoryDocumentBackend } from "#public/memory/file/backend.js";
/**
 * Creates a process-local document backend for development and tests.
 * Contents disappear when the process or backend instance is replaced.
 */
export declare function inMemory(): MemoryDocumentBackend;
