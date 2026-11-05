import { type MemoryDocumentBackend } from "#public/memory/file/backend.js";
import { type MemoryProvider } from "#public/memory/index.js";
/** Configuration for the bounded, model-maintained memory file provider. */
export interface FileMemoryOptions {
    /** Storage implementation. Defaults by runtime environment. */
    readonly backend?: MemoryDocumentBackend;
    /** Maximum characters in the recalled memory message. Defaults to 4,000. */
    readonly maxCharacters?: number;
}
/**
 * Creates a bounded persistent memory file recalled at eve memory boundaries
 * and maintained through scope-bound tools.
 */
export declare function fileMemory(options?: FileMemoryOptions): MemoryProvider;
