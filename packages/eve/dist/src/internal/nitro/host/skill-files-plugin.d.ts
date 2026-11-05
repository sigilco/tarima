/** The Nitro virtual id of the generated plugin that installs a build's skill files. */
export declare const SKILL_FILES_PLUGIN_ID = "#eve/skill-files";
/**
 * Stages the root agent's materialized `skills/` tree for a production build
 * and returns the source of the `#eve/skill-files` Nitro plugin that embeds it.
 *
 * The listing and bytes come from {@link createDiskSkillFileSource}, the same
 * source dev reads, so both modes agree on which files exist. Each shipped
 * file is staged once per SHA-256 and loaded lazily through a `bytes:`
 * import, so authored names never reach an import specifier and Nitro's
 * `replace` never sees the contents. The index loads through `text:`. Files
 * over {@link MAX_SKILL_FILE_BYTES} are indexed by size only, and directories
 * are indexed so empty ones survive the build.
 */
export declare function writeSkillFilesPlugin(input: {
    readonly skills: readonly string[];
    /** The materialized `skills/` directory of the root agent's workspace resources. */
    readonly skillsRoot: string;
    /** Build-owned directory the staged files and the index are written to. */
    readonly stagingDirectory: string;
}): Promise<string>;
