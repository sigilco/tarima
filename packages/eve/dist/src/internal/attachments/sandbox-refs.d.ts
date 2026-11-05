/**
 * Sandbox-resident attachment references.
 *
 * Refs are the compact wire format used after inbound attachment bytes
 * have been written into the sandbox:
 *
 * ```
 * eve-sandbox:?path=<urlencoded-resolved-path>&size=<bytes>&type=<mediaType>[&width=&height=][&pages=]
 * ```
 */
import { type MediaMetadata } from "#internal/attachments/media-metadata.js";
/**
 * Custom URL scheme used by every sandbox-resident attachment ref. The
 * trailing colon is part of the scheme per WHATWG URL semantics.
 */
export declare const SANDBOX_URL_SCHEME = "eve-sandbox:";
/**
 * Serializable description of one sandbox-resident file attachment.
 *
 * `path` is the backend-native absolute path returned by
 * {@link SandboxSession.resolvePath}; the {@link MediaMetadata} fields are
 * snapshotted so hydration and token estimates never re-read the file.
 */
export interface SandboxRef extends MediaMetadata {
    readonly path: string;
}
/**
 * Encodes a {@link SandboxRef} as a URL suitable for use as
 * `FilePart.data`.
 */
export declare function encodeSandboxRef(ref: SandboxRef): URL;
/**
 * Parses a {@link SandboxRef} from its URL form.
 */
export declare function decodeSandboxRef(value: URL | string): SandboxRef;
/**
 * Whether an attachment ref reaches the model as bytes as well as its label.
 * Only shapes every major provider reads natively qualify: PNG, JPEG, GIF,
 * and WebP images up to 3 MiB and 8000 px per side, and PDFs up to 20 MiB.
 * Staging verifies these media types from the bytes. Pure in the ref, so a
 * message renders the same way on every model call.
 */
export declare function inlinesSandboxRefAsBytes(ref: SandboxRef): boolean;
/**
 * Cheap runtime check: does this value look like a sandbox-ref URL?
 *
 * Accepts `URL` instances with the `eve-sandbox:` scheme. Strings are
 * NOT accepted — the staging and hydration layers only inspect
 * URL-instance `FilePart.data` values, matching the existing
 * `data instanceof URL` branch in `readFileData`.
 */
export declare function isSandboxRefUrl(value: unknown): value is URL;
