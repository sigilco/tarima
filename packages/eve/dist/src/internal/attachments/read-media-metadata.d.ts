import { type MediaMetadata } from "#internal/attachments/media-metadata.js";
/**
 * Reads the dimensions or page count of a whole payload. Counting PDF pages
 * needs `node:zlib`, which the workflow driver bundle rejects, so only step
 * code may import this module.
 */
export declare function readMediaMetadata(bytes: Uint8Array, mediaType: string): MediaMetadata;
