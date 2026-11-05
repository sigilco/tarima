/**
 * Byte-level media facts read once when a file enters the session, so token
 * estimates never need the payload again.
 */
/** Facts about one file payload that drive its token estimate. */
export interface MediaMetadata {
    readonly mediaType: string;
    readonly size: number;
    readonly width?: number;
    readonly height?: number;
    readonly pages?: number;
}
/**
 * Estimates the input tokens a provider bills for one file. Images and PDFs
 * use provider-style costs; anything else falls back to the size of its
 * base64 text, which is how text-only providers receive it.
 */
export declare function estimateMediaTokens(metadata: MediaMetadata): number;
/**
 * The media type a staged file carries: the format its bytes prove for an
 * image, PDF, or untyped file, or the declared type otherwise. A declared
 * PNG, JPEG, GIF, WebP, or PDF that the bytes don't confirm becomes
 * `application/octet-stream`, so no provider receives bytes it would reject.
 */
export declare function verifyMediaType(bytes: Uint8Array, declared: string): string;
/** The image formats eve can verify from bytes, and that every major provider reads. */
export declare const INLINE_IMAGE_MEDIA_TYPES: ReadonlySet<string>;
/**
 * Whether the bytes start with a PDF header. The format allows leading bytes,
 * but providers expect the header first, and a match deeper in would mark text
 * that only mentions it.
 */
export declare function hasPdfHeader(bytes: Uint8Array): boolean;
/** Names the PNG, GIF, JPEG, or WebP format its leading bytes identify. */
export declare function detectImageMediaType(bytes: Uint8Array): string | undefined;
/** Reads PNG, GIF, JPEG, or WebP dimensions from the leading bytes. */
export declare function readImageDimensions(bytes: Uint8Array): {
    readonly width: number;
    readonly height: number;
} | undefined;
