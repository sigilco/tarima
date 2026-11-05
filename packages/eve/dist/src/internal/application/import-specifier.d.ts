/**
 * Converts filesystem paths into ESM-safe import specifiers.
 *
 * Node's ESM loader rejects raw Windows absolute paths such as
 * `G:\app\handler.js` because the drive letter is parsed as a URL scheme.
 * Generated source should import filesystem targets through `file://` URLs
 * while leaving virtual, package, and relative specifiers usable by bundlers.
 */
export declare function normalizeEsmImportSpecifier(specifier: string): string;
/**
 * Serializes an import specifier for direct insertion into generated ESM code.
 */
export declare function stringifyEsmImportSpecifier(specifier: string): string;
/**
 * Serializes a Nitro `text:` or `bytes:` import of a file for generated ESM.
 * Nitro's `replace` skips these modules, so data loaded through them reaches
 * the bundle exactly as written.
 */
export declare function stringifyNitroDataImportSpecifier(kind: "bytes" | "text", path: string): string;
