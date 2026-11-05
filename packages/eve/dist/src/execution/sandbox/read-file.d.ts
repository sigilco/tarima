import { type MediaMetadata } from "#internal/attachments/media-metadata.js";
import type { SandboxSession } from "#shared/sandbox-session.js";
/**
 * Typed input accepted by {@link executeReadFileOnSandbox}.
 */
export interface ReadFileInput {
    readonly filePath: string;
    readonly limit?: number;
    readonly offset?: number;
}
/**
 * Structured result returned from {@link executeReadFileOnSandbox}.
 */
export interface ReadFileResult {
    readonly content: string;
    /**
     * Set when the file is a PNG, JPEG, GIF, or WebP image or a PDF that the
     * model reads natively. Carries no bytes, so `call.settled` stays small.
     */
    readonly file?: MediaMetadata;
    readonly nextOffset?: number;
    readonly path: string;
    readonly totalLines: number;
    readonly truncated: boolean;
}
/**
 * Reads one text file from the sandbox, applies output shaping
 * (offset, limit, line numbering, truncation), and persists a full-file
 * stamp into durable read-file state for stale-write detection. Images and
 * PDFs return their bytes for the model to view instead.
 *
 * Used by the framework `read_file` tool and authored wrappers around its
 * exported definition.
 */
export declare function executeReadFileOnSandbox(sandbox: SandboxSession, args: ReadFileInput): Promise<ReadFileResult>;
