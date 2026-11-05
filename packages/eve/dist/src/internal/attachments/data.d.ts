/**
 * Shared helpers for reading AI SDK `FilePart.data` values without
 * fetching remote resources.
 *
 * Every value has one meaning: typed arrays, base64 strings, `data:` URLs,
 * and tagged `data` or `text` shapes carry bytes; any other string or `URL`
 * with a scheme is a link the staging layer resolves; a provider reference
 * names a file the provider already holds. Anything else is unreadable.
 */
/** What a `FilePart.data` value carries. */
export type FileData = {
    readonly kind: "bytes";
    readonly bytes: Buffer;
} | {
    readonly kind: "link";
    readonly url: URL;
} | {
    readonly kind: "reference";
} | {
    readonly kind: "unreadable";
};
/**
 * Classifies one `FilePart.data` value. A string with a framework-internal
 * scheme is unreadable: only eve mints those refs, so a caller-supplied one
 * must never turn into a privileged read.
 */
export declare function readFileData(data: unknown): FileData;
/**
 * Whether `FilePart.data` is a link or unreadable, so eve must resolve it
 * before a provider sees it. Never decodes the payload.
 */
export declare function isUnresolvedFileData(data: unknown): boolean;
/**
 * Returns the byte length of `FilePart.data` without performing any IO, or
 * `null` when only a fetch could tell.
 */
export declare function getKnownByteLength(data: unknown): number | null;
