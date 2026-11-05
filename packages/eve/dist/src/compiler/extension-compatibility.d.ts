export declare const EXTENSION_COMPATIBILITY_MANIFEST_KIND = "eve-extension";
export declare const EXTENSION_COMPATIBILITY_MANIFEST_FORMAT_VERSION = 3;
export declare const EXTENSION_COMPATIBILITY_MANIFEST_FILENAME = "_manifest.json";
/** A legacy distribution must be rebuilt before its contents can be mounted. */
export declare class UnsupportedExtensionManifestVersionError extends Error {
}
export declare const EXTENSION_DISTRIBUTION_CONTRACT_MAJOR = 0;
export declare const SUPPORTED_EXTENSION_DISTRIBUTION_CONTRACT_MAJORS: readonly number[];
/** Metadata at the root of a built extension distribution. */
export interface ExtensionCompatibilityManifest {
    readonly kind: typeof EXTENSION_COMPATIBILITY_MANIFEST_KIND;
    readonly formatVersion: typeof EXTENSION_COMPATIBILITY_MANIFEST_FORMAT_VERSION;
    /** Minimum compatible eve release: the version used to build the extension. */
    readonly builtWithEve: string;
    readonly contractMajor: number;
    readonly build?: {
        readonly externalDependencies: readonly string[];
    };
}
export type ExtensionVersionIncompatibility = {
    readonly kind: "newer-eve";
    readonly minimumVersion: string;
} | {
    readonly kind: "unsupported-contract";
    readonly contractMajor: number;
};
/** Checks the distribution before loading authored extension code. */
export declare function checkExtensionVersionCompatibility(manifest: ExtensionCompatibilityManifest, consumerVersion: string, supportedMajors?: readonly number[]): ExtensionVersionIncompatibility | undefined;
export declare function serializeExtensionCompatibilityManifest(manifest: ExtensionCompatibilityManifest): string;
export declare function parseExtensionCompatibilityManifest(raw: string, manifestPath: string): ExtensionCompatibilityManifest;
export declare function readExtensionCompatibilityManifest(manifestPath: string): Promise<ExtensionCompatibilityManifest>;
export declare function writeExtensionCompatibilityManifest(distRoot: string, manifest: ExtensionCompatibilityManifest): Promise<void>;
