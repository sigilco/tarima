import type { CompiledWorkspaceResourceRoot } from "#compiler/manifest.js";
import type { RuntimeCompiledArtifactsSource } from "#runtime/compiled-artifacts-source.js";
/** Largest skill file `readSkill` returns. */
export declare const MAX_SKILL_FILE_BYTES: number;
/** Canonical file name of a skill package's entry markdown. */
export declare const SKILL_ENTRY_FILE_NAME = "SKILL.md";
/**
 * Whether a file name is a skill's entry markdown. Discovery accepts any case
 * variant, such as `skill.md`, and materialization keeps the authored name.
 */
export declare function isSkillEntryFileName(name: string): boolean;
export type SkillReadErrorCode = "invalid-path" | "too-large" | "unavailable" | "unknown-file" | "unknown-skill";
/** Thrown by `readSkill`. `code` lets a channel map the failure onto its own protocol. */
export declare class SkillReadError extends Error {
    readonly code: SkillReadErrorCode;
    constructor(code: SkillReadErrorCode, message: string);
}
/** One regular file of a skill: its `/`-separated path under the skill root and its size. */
export interface SkillFileEntry {
    readonly path: string;
    readonly size: number;
}
/**
 * Lookup into the compiled skill files of one agent. Paths are `/`-separated
 * and relative to the skill root, e.g. `SKILL.md` or `references/api.md`.
 */
export interface SkillFileSource {
    /** Regular files of one skill, sorted by path. Empty when the skill has no materialized files. */
    listFiles(skill: string): Promise<readonly SkillFileEntry[]>;
    /**
     * Every directory of one skill below its root, sorted by path, including
     * empty ones that no listed file implies.
     */
    listDirectories(skill: string): Promise<readonly string[]>;
    readFile(skill: string, path: string): Promise<Uint8Array>;
}
/**
 * One indexed file: `[path, size, sha256]`. `sha256` is `null` for files over
 * {@link MAX_SKILL_FILE_BYTES}, which are listed but not shipped.
 */
export type SkillFilesIndexEntry = readonly [path: string, size: number, sha256: string | null];
/**
 * Index of the skill files a production build ships, written by `eve build`.
 * Entries are arrays, not object keys, so names such as `__proto__` stay
 * plain data.
 */
export interface SkillFilesIndex {
    /** `[skill, files, directories]`, sorted by skill then path. */
    readonly skills: readonly (readonly [
        skill: string,
        files: readonly SkillFilesIndexEntry[],
        directories: readonly string[]
    ])[];
}
/** The skill files a production build embeds, as its generated Nitro plugin installs them. */
export interface BundledSkillFiles {
    /** The JSON text of a {@link SkillFilesIndex}. */
    readonly index: string;
    /** Loads the shipped bytes with this SHA-256. Every file with that digest shares the array. */
    readonly read: (sha256: string) => Promise<Uint8Array>;
}
/** The parsed form of {@link BundledSkillFiles} a runtime session holds. */
export interface InstalledSkillFiles {
    readonly read: (sha256: string) => Promise<Uint8Array>;
    readonly skills: ReadonlyMap<string, IndexedSkill>;
}
interface IndexedSkill {
    readonly files: readonly SkillFilesIndexEntry[];
    readonly directories: readonly string[];
}
/** Installs a production build's embedded skill files on the active runtime session. */
export declare function installBundledSkillFiles(input: BundledSkillFiles): void;
/**
 * Selects the skill file source for the active compiled artifacts.
 *
 * Skill files are materialized under the node's workspace resource root by
 * `compiler/workspace-resources.ts`. Disk artifacts (dev) read that tree with
 * {@link createDiskSkillFileSource}; bundled artifacts (production builds)
 * read the files `eve build` embedded for the root agent.
 */
export declare function createCompiledSkillFileSource(input: {
    readonly compiledArtifactsSource: RuntimeCompiledArtifactsSource;
    readonly workspaceResourceRoot: CompiledWorkspaceResourceRoot;
}): SkillFileSource;
/**
 * Reads skill files from a materialized `skills/<name>/` tree.
 *
 * Only regular files reached through real directories are served: a
 * symlinked skill root lists nothing, listing skips symlinks, every path
 * component is checked with `lstat` before opening, the leaf is opened with
 * `O_NOFOLLOW` where the platform defines it, and the `realpath` of the
 * target must stay under the `realpath` of the skill root. These checks are
 * not atomic; the tree is the app's own compile output, so a writer that
 * could race them can already change what is served.
 */
export declare function createDiskSkillFileSource(skillsRoot: string): SkillFileSource;
/**
 * Reads one file of one skill, byte for byte, given any caller-supplied path.
 *
 * With no `path`, reads the skill's entry markdown under whatever case variant
 * of `SKILL.md` it was authored with. An explicit top-level `SKILL.md` matches
 * the entry file case-insensitively too; every other path must match a listed
 * file exactly. Files over {@link MAX_SKILL_FILE_BYTES} are `too-large`.
 */
export declare function readSkillFile(input: {
    readonly path?: string;
    readonly skill: string;
    readonly source: SkillFileSource;
}): Promise<Uint8Array>;
export declare function comparePaths(left: string, right: string): number;
export {};
