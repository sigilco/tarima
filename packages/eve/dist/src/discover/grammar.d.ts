import type { ModuleSourceRef } from "#shared/source-ref.js";
import { type DiscoverDiagnostic } from "#discover/diagnostics.js";
import { type DirectoryEntryType } from "#discover/filesystem.js";
import { type InstructionsSourceRef } from "#discover/manifest.js";
import type { ProjectSource, ProjectSourceEntry } from "#discover/project-source.js";
/**
 * Shared diagnostic emitted when a slot has multiple authored module sources.
 */
export declare const DISCOVER_MODULE_SLOT_COLLISION = "discover/module-slot-collision";
/**
 * Shared diagnostic emitted when the required instructions prompt source
 * is missing.
 */
export declare const DISCOVER_REQUIRED_INSTRUCTIONS_MISSING = "discover/required-instructions-missing";
/**
 * Shared diagnostic emitted when discovery falls back to the deprecated
 * `system.{md,ts,...}` slot because no `instructions.{md,ts,...}` source
 * was found. The fallback resolves successfully; the warning prompts the
 * author to rename the file.
 */
export declare const DISCOVER_DEPRECATED_SYSTEM_SLOT = "discover/deprecated-system-slot";
/**
 * Shared diagnostic emitted when a slot has both markdown and module sources.
 */
export declare const DISCOVER_SLOT_COLLISION = "discover/slot-collision";
/**
 * Shared diagnostic emitted when the authored `tools/` root is not a
 * directory.
 */
export declare const DISCOVER_TOOLS_DIRECTORY_INVALID = "discover/tools-directory-invalid";
/**
 * Shared diagnostic emitted when the authored `hooks/` root is not a
 * directory.
 */
export declare const DISCOVER_HOOKS_DIRECTORY_INVALID = "discover/hooks-directory-invalid";
/**
 * Shared diagnostic emitted when the authored `channels/` root is not a
 * directory.
 */
export declare const DISCOVER_CHANNELS_DIRECTORY_INVALID = "discover/channels-directory-invalid";
/**
 * Shared diagnostic emitted when the authored `extensions/` root is not a
 * directory.
 */
export declare const DISCOVER_EXTENSIONS_DIRECTORY_INVALID = "discover/extensions-directory-invalid";
/**
 * Shared diagnostic emitted when an authored `tools/*.{ts,…}` filename does
 * not satisfy the model tool-name charset rule.
 */
export declare const DISCOVER_TOOL_NAME_INVALID = "discover/tool-name-invalid";
/**
 * Shared diagnostic emitted when the authored `sandbox/` root is not a
 * directory. The diagnostic code string retains its plural suffix for
 * stability across manifest versions.
 */
export declare const DISCOVER_SANDBOX_DIRECTORY_INVALID = "discover/sandbox-directory-invalid";
/**
 * Shared diagnostic emitted when an authored `hooks/**` filename or
 * directory segment does not satisfy the hook slug charset rule.
 */
export declare const DISCOVER_HOOK_NAME_INVALID = "discover/hook-name-invalid";
/**
 * Shared diagnostic emitted when an authored `extensions/*.{ts,…}` mount
 * filename does not satisfy the extension namespace charset rule.
 */
export declare const DISCOVER_EXTENSION_NAME_INVALID = "discover/extension-name-invalid";
/**
 * Tool filename charset. The slug must start with an ASCII letter and may
 * contain ASCII letters, digits, underscores, and dashes. The 64-character
 * cap matches the most restrictive provider tool-name limit.
 *
 * The model-facing tool name is the filename slug verbatim — there is no
 * authored `name` override and no compile-time normalization. Authors who
 * want a snake_case identifier should name the file in snake_case.
 */
export declare const TOOL_SLUG_PATTERN: RegExp;
/** {@link TOOL_SLUG_PATTERN} in words, for errors about a name that breaks it. */
export declare const TOOL_SLUG_RULE = "Expected ASCII letters, digits, underscores, and dashes only, starting with a letter, up to 64 characters.";
/**
 * Skill name charset: {@link TOOL_SLUG_PATTERN}, except that a name may start
 * with a digit, so a skill such as `3d-modeling` from the Agent Skills
 * standard ports over as-is. A skill is loaded by name, never called as a
 * tool, so tool-name limits on the first character don't apply.
 */
export declare const SKILL_NAME_PATTERN: RegExp;
/** {@link SKILL_NAME_PATTERN} in words, for errors about a name that breaks it. */
export declare const SKILL_NAME_RULE = "Expected ASCII letters, digits, underscores, and dashes only, starting with a letter or digit, up to 64 characters.";
/**
 * Connection filename charset. Connections use the same lowercase
 * kebab-case rule as sandbox since they are not directly exposed to
 * model APIs as identifiers.
 */
export declare const CONNECTION_SLUG_PATTERN: RegExp;
/**
 * Shared diagnostic emitted when discovery ignores one unsupported directory.
 */
export declare const DISCOVER_UNSUPPORTED_DIRECTORY = "discover/unsupported-directory";
/**
 * Reads sorted agent source entries, excluding colocated tests unless reading resources.
 */
export declare function readSortedDirectoryEntries(source: ProjectSource, directoryPath: string, options?: {
    readonly includeTests?: boolean;
}): Promise<ProjectSourceEntry[]>;
/**
 * Discovers instructions sources from a root directory.
 *
 * Supports three forms:
 * 1. **Directory**: `agent/instructions/` with multiple `.md` and `.ts` files.
 * 2. **Flat file**: `agent/instructions.md` or `agent/instructions.{ts,...}`.
 * 3. **Legacy**: `agent/system.{md,ts,...}` with a deprecation warning.
 *
 * A flat file and a directory can coexist — the flat file appears first
 * in the returned array.
 */
export declare function discoverInstructionsSource(input: {
    required?: boolean;
    rootEntries: readonly ProjectSourceEntry[];
    rootPath: string;
    source: ProjectSource;
}): Promise<{
    diagnostics: DiscoverDiagnostic[];
    instructions: InstructionsSourceRef[];
}>;
/**
 * Discovers one flat module slot such as `agent.ts` or `subagent.cjs`.
 */
export declare function discoverFlatModuleSource(input: {
    missingDiagnostic?: {
        code: string;
        message: string;
    };
    rootEntries: readonly ProjectSourceEntry[];
    rootPath: string;
    slotName: string;
}): {
    diagnostics: DiscoverDiagnostic[];
    module?: ModuleSourceRef;
};
/**
 * Returns a discovery diagnostic when a tool slot name violates
 * {@link TOOL_SLUG_PATTERN}, or `null` when it satisfies the rule.
 *
 * Wired in by {@link discoverNamedSourceDirectory} callers via
 * `validateSegment` so the discover layer rejects illegal filenames before
 * the compiler ever loads the module.
 */
export declare function createToolNameDiagnostic(slotName: string, sourcePath: string): DiscoverDiagnostic | null;
/**
 * Returns a discovery diagnostic when a connection slot name violates
 * {@link CONNECTION_SLUG_PATTERN}, or `null` when it satisfies the rule.
 */
export declare function createConnectionNameDiagnostic(slotName: string, sourcePath: string): DiscoverDiagnostic | null;
/**
 * Returns a discovery diagnostic when a channel filesystem segment violates
 * {@link CHANNEL_SLUG_PATTERN}, or `null` when it satisfies the rule.
 *
 * Each path segment under `agent/channels/` is validated independently —
 * file leaves and directory ancestors both go through this check so the
 * runtime never sees a malformed URL segment.
 */
export declare function createChannelNameDiagnostic(segment: string, sourcePath: string): DiscoverDiagnostic | null;
/**
 * Returns a discovery diagnostic when a hook filesystem segment violates
 * {@link HOOK_SLUG_PATTERN}, or `null` when it satisfies the rule.
 *
 * Each path segment under `agent/hooks/` is validated independently so
 * the runtime never sees a malformed slug.
 */
export declare function createHookNameDiagnostic(segment: string, sourcePath: string): DiscoverDiagnostic | null;
/**
 * Returns a discovery diagnostic when an extension mount filename violates
 * {@link EXTENSION_SLUG_PATTERN}, or `null` when it satisfies the rule.
 *
 * The mount basename becomes the namespace prefixed onto every contribution
 * the extension composes into the consuming agent, so it must be a legal
 * identifier segment.
 */
export declare function createExtensionNameDiagnostic(slotName: string, sourcePath: string): DiscoverDiagnostic | null;
export { discoverNamedSourceDirectory, type DiscoverNamedSourceDirectoryModuleInput, type DiscoverNamedSourceDirectoryWithMarkdownInput, } from "#discover/named-source-directory.js";
/**
 * Emits shared diagnostics for unsupported root-level directories.
 */
export declare function createUnsupportedRootDirectoryDiagnostics(input: {
    classifyEntry: (name: string, entryType: DirectoryEntryType) => string;
    createUnsupportedDirectoryMessage: (directoryName: string) => string;
    rootEntries: readonly ProjectSourceEntry[];
    rootPath: string;
}): DiscoverDiagnostic[];
/**
 * Creates one slot-collision diagnostic with shared wording.
 */
export declare function createSlotCollisionDiagnostic(directoryPath: string, slotLogicalPath: string, fileNames: readonly string[]): DiscoverDiagnostic;
/**
 * Creates one module-slot collision diagnostic with shared wording.
 */
export declare function createModuleSlotCollisionDiagnostic(directoryPath: string, slotLogicalPath: string, fileNames: readonly string[]): DiscoverDiagnostic;
