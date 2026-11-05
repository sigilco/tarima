import { type ProjectSource } from "#discover/project-source.js";
import type { DiscoverDiagnostic } from "#discover/diagnostics.js";
import type { ResolvedExtensionMount } from "#discover/manifest.js";
import type { BundledExtensionMount } from "#compiler/bundled-extension.js";
export declare function discoverBundledExtension(input: {
    readonly mount: BundledExtensionMount;
    readonly source?: ProjectSource;
}): Promise<{
    readonly diagnostics: readonly DiscoverDiagnostic[];
    readonly mount: ResolvedExtensionMount;
}>;
