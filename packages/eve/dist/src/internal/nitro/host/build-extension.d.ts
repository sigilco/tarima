import { tryReadExtensionBuildConfig, type ExtensionBuildConfig } from "#internal/nitro/host/extension-build-config.js";
export { tryReadExtensionBuildConfig };
export type { ExtensionBuildConfig };
/**
 * Prefix of the per-build staging directory created inside the extension
 * package. It must share a filesystem with the output directory so the final
 * swap is a rename.
 */
export declare const EXTENSION_BUILD_STAGING_DIRECTORY_PREFIX = ".eve-extension-build-";
/**
 * Builds a dist-only extension package. Authored modules are transformed as a
 * path-preserving graph, declarations and assets are emitted beside them, and
 * compatibility-only metadata is written at the agent-shaped dist root.
 */
export declare function buildExtensionPackage(rootDir: string, config: ExtensionBuildConfig): Promise<string>;
