import { type DiscoverDiagnostic } from "#discover/diagnostics.js";
import type { ExtensionSourceRef } from "#discover/manifest.js";
import { type ProjectSource } from "#discover/project-source.js";
/**
 * Emitted when one namespace is claimed by both a file mount
 * (`extensions/<ns>.ts`) and a directory mount (`extensions/<ns>/`).
 */
export declare const DISCOVER_EXTENSION_MOUNT_AMBIGUOUS = "discover/extension-mount-ambiguous";
/**
 * Emitted when a directory mount (`extensions/<ns>/`) is missing its required
 * `extension.<ext>` mount declaration.
 */
export declare const DISCOVER_EXTENSION_MOUNT_MISSING_DECLARATION = "discover/extension-mount-missing-declaration";
/**
 * Emitted when an extension declares its own `extensions/` mount slot. Extensions
 * cannot mount other extensions yet; the slot is reserved so enabling nesting
 * later is additive rather than a surprise.
 */
export declare const DISCOVER_EXTENSION_NESTED_MOUNT_UNSUPPORTED = "discover/extension-nested-mount-unsupported";
/**
 * Emitted when an extension distribution's compatibility manifest is missing
 * or malformed.
 */
export declare const DISCOVER_EXTENSION_COMPATIBILITY_INVALID = "discover/extension-compatibility-invalid";
/**
 * Emitted when the consumer cannot load this extension distribution.
 */
export declare const DISCOVER_EXTENSION_VERSION_INCOMPATIBLE = "discover/extension-version-incompatible";
/**
 * Emitted when an extension source tree declares agent-level config (`agent.ts`),
 * which is the consuming agent's to own.
 */
export declare const DISCOVER_EXTENSION_AGENT_CONFIG_UNSUPPORTED = "discover/extension-agent-config-unsupported";
/**
 * Emitted when an extension source tree declares a `sandbox`, which is the
 * consuming agent's to own.
 */
export declare const DISCOVER_EXTENSION_SANDBOX_UNSUPPORTED = "discover/extension-sandbox-unsupported";
export declare const DISCOVER_EXTENSION_MEMORY_UNSUPPORTED = "discover/extension-memory-unsupported";
/**
 * Emitted when an extension declares agent-level instrumentation. Instrumentation
 * is a singleton owned by the consuming agent and cannot be namespace-scoped.
 */
export declare const DISCOVER_EXTENSION_INSTRUMENTATION_UNSUPPORTED = "discover/extension-instrumentation-unsupported";
/**
 * Resolved on-disk location of one mounted extension package.
 */
interface ExtensionMountLocation {
    /** Mount namespace derived from the mount filename (e.g. `crm`). */
    readonly namespace: string;
    /** Package specifier the mount imports (e.g. `@acme/crm`). */
    readonly specifier: string;
    /** Package name from the resolved `package.json`, used to scope state. */
    readonly packageName: string;
    /** Absolute path to the resolved package root. */
    readonly packageRoot: string;
    /** Absolute path to the extension's agent-shaped distribution root. */
    readonly sourceRoot: string;
    /** Runtime packages this extension requires the consuming application to externalize. */
    readonly externalDependencies: readonly string[];
}
/**
 * Package roots resolved from one extension mount before its distribution is
 * inspected. Development uses this to build a mounted workspace extension
 * before the consumer requires its dist tree to exist.
 */
interface ExtensionMountPackageLocation {
    /** Mount namespace derived from the mount filename. */
    readonly namespace: string;
    /** Package specifier read from the mount declaration. */
    readonly specifier: string;
    /** Package name from the resolved package manifest. */
    readonly packageName: string;
    /** Absolute path to the resolved package root. */
    readonly packageRoot: string;
    /** Absolute authoring root when the package publishes a source-backed contract. */
    readonly authoredSourceRoot?: string;
    /** Absolute path to the agent-shaped distribution root. */
    readonly distRoot: string;
    /** The distribution is shipped by the resolved eve package itself. */
    readonly builtIn: boolean;
}
/**
 * Derives the mount namespace from an `extensions/<name>.<ext>` logical path.
 */
export declare function mountNamespace(logicalPath: string): string;
/**
 * Derives the mount namespace from a mount ref's `extensions/…` logical path
 * for either mount form: the file form (`extensions/crm.ts` → `crm`) or the
 * directory form (`extensions/crm/extension.ts` → `crm`).
 */
export declare function mountRefNamespace(logicalPath: string): string;
/**
 * Resolves one extension mount to its package and agent-shaped source root
 * without importing the mount module. Reads the mount source text to extract
 * the package specifier, resolves the package, and reads
 * `package.json#eve.extension.dist` for the agent-shaped distribution root.
 */
export declare function locateExtensionMount(input: {
    readonly source: ProjectSource;
    readonly agentRoot: string;
    readonly appRoot: string;
    readonly mount: ExtensionSourceRef;
    /**
     * Mount namespace the caller derived from the mount path — passed in because
     * the file and directory mount forms name it at different path positions.
     */
    readonly namespace: string;
}): Promise<{
    location?: ExtensionMountLocation;
    diagnostics: DiscoverDiagnostic[];
}>;
/**
 * Resolves one extension mount through its package manifest without requiring
 * a built distribution or compatibility manifest.
 */
export declare function locateExtensionMountPackage(input: {
    readonly source: ProjectSource;
    readonly agentRoot: string;
    readonly appRoot: string;
    readonly mount: ExtensionSourceRef;
    readonly namespace: string;
}): Promise<{
    location?: ExtensionMountPackageLocation;
    diagnostics: DiscoverDiagnostic[];
}>;
export {};
