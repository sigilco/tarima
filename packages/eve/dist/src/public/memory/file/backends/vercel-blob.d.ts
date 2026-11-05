import { type MemoryDocumentBackend } from "#public/memory/file/backend.js";
/** Credentials and pathname configuration for {@link vercelBlob}. */
export interface VercelBlobBackendOptions {
    /** Vercel Blob read-write token. Defaults to `BLOB_READ_WRITE_TOKEN`. */
    readonly token?: string;
    /** Vercel OIDC token. Defaults to `VERCEL_OIDC_TOKEN`. */
    readonly oidcToken?: string;
    /** Blob store ID used with OIDC. Defaults to `BLOB_STORE_ID`. */
    readonly storeId?: string;
    /** Object pathname prefix. Defaults to `eve/memory/file`. */
    readonly prefix?: string;
}
/** Creates a private Vercel Blob backend for bounded memory files. */
export declare function vercelBlob(options?: VercelBlobBackendOptions): MemoryDocumentBackend;
