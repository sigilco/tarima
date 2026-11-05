import type { Dirent } from "node:fs";
/**
 * Supported authored JavaScript and TypeScript module file extensions.
 */
export declare const SUPPORTED_AUTHORED_MODULE_FILE_EXTENSIONS: readonly [".cts", ".mts", ".cjs", ".mjs", ".ts", ".js"];
/**
 * Filesystem entry type used by discovery classifiers.
 */
export type DirectoryEntryType = "directory" | "file" | "other";
/**
 * Classified root-level agent entry.
 */
type AgentRootEntryKind = "agent-config-module" | "channels-directory" | "connections-directory" | "extensions-directory" | "hooks-directory" | "ignored-directory" | "instrumentation-directory" | "instructions-directory" | "instructions-markdown" | "instructions-module" | "lib-directory" | "memory-directory" | "memory-module" | "sandbox-directory" | "schedules-directory" | "skills-directory" | "system-markdown" | "system-module" | "tools-directory" | "unknown" | "subagents-directory";
/**
 * Classified local-subagent root entry.
 */
type LocalSubagentEntryKind = "agent-config-module" | "connections-directory" | "extensions-directory" | "hooks-directory" | "ignored-directory" | "instructions-directory" | "instructions-markdown" | "instructions-module" | "invalid-schedules-directory" | "lib-directory" | "memory-directory" | "memory-module" | "sandbox-directory" | "skills-directory" | "system-markdown" | "system-module" | "tools-directory" | "unknown" | "subagents-directory";
/**
 * Classified Agent Skills package entry.
 */
type SkillPackageEntryKind = "skill-assets-directory" | "skill-markdown" | "skill-references-directory" | "skill-resource" | "skill-scripts-directory";
/**
 * Classified top-level entry inside `skills/`.
 */
type SkillsDirectoryEntryKind = "flat-skill-markdown" | "flat-skill-module" | "ignored-declaration" | "ignored-source-map" | "skill-package-directory" | "unknown";
/**
 * Returns the normalized entry type for a Node filesystem dirent.
 */
export declare function getDirectoryEntryType(entry: Pick<Dirent, "isDirectory" | "isFile">): DirectoryEntryType;
/**
 * Returns whether an entry marks a directory as an app root for nested agents.
 */
export declare function isProjectMarkerEntry(name: string, entryType: DirectoryEntryType): boolean;
/**
 * Classifies a top-level agent-root entry according to the spec-legal grammar.
 */
export declare function isDiscoverableAgentRootEntry(name: string, entryType: DirectoryEntryType): boolean;
export declare function classifyAgentRootEntry(name: string, entryType: DirectoryEntryType): AgentRootEntryKind;
/**
 * Classifies a local-subagent package root entry according to the spec-legal grammar.
 */
export declare function classifyLocalSubagentEntry(name: string, entryType: DirectoryEntryType): LocalSubagentEntryKind;
/**
 * Classifies a file or directory inside an Agent Skills package.
 */
export declare function classifySkillPackageEntry(name: string, entryType: DirectoryEntryType): SkillPackageEntryKind;
/**
 * Classifies one top-level entry inside the authored `skills/` directory.
 */
export declare function classifySkillsDirectoryEntry(name: string, entryType: DirectoryEntryType): SkillsDirectoryEntryKind;
/**
 * Normalizes an agent-root-relative logical path to forward slashes.
 */
export declare function normalizeLogicalPath(input: string): string;
/**
 * Returns the authored module basename when the file uses a supported module
 * extension.
 */
export declare function getSupportedModuleBaseName(name: string): string | null;
/** Returns whether a filename is a TypeScript declaration module. */
export declare function isTypeScriptDeclarationFileName(name: string): boolean;
/** Identifies colocated tests to omit from automatic agent source discovery. */
export declare function isAuthoredTestPath(path: string): boolean;
/** Returns whether a filename is a source map for a generated module or declaration. */
export declare function isGeneratedSourceMapFileName(name: string): boolean;
/**
 * Returns whether the file name matches one supported authored module basename.
 */
export declare function matchesSupportedModuleBaseName(name: string, baseName: string): boolean;
/**
 * Removes a final file extension from a logical path when present.
 */
export declare function stripLogicalPathExtension(input: string): string;
export {};
