import { EveAttachmentError } from "#internal/attachments/errors.js";
import type { UploadPolicy } from "#public/channels/upload-policy.js";
/** The byte cap an upload policy sets; a disabled policy accepts nothing. */
export declare function maxBytesOf(policy: UploadPolicy): number;
/**
 * Reads a download's or request's body, failing as soon as it passes `maxBytes`. Checks a
 * declared `content-length` first, then counts what streams in, so a body that
 * misstates or omits its length still stops at the limit.
 */
export declare function readLimitedBytes(response: Pick<Response, "body" | "headers">, maxBytes: number, adapterKind: string): Promise<Buffer>;
/**
 * Wraps `fetch` so every response body fails once it passes `maxBytes`, for a
 * download that reads the body itself, such as a vendored client's.
 */
export declare function limitedFetch(fetchImpl: typeof globalThis.fetch, maxBytes: number, adapterKind: string): typeof globalThis.fetch;
/** Fails a download whose bytes arrived some other way than a `Response`, once they're in hand. */
export declare function assertWithinLimit(bytes: Uint8Array, maxBytes: number, adapterKind: string): void;
export declare function overLimit(maxBytes: number, adapterKind: string): EveAttachmentError;
