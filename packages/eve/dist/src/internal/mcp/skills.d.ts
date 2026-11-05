import type { AgentSkillDescription } from "#channel/agent-description.js";
import { type SkillFileSource } from "#channel/skill-files.js";
import { type McpServerFeature } from "#internal/mcp/streamable-http-server.js";
/** SEP-2640 extension identifier. */
export declare const MCP_SKILLS_EXTENSION = "io.modelcontextprotocol/skills";
/** SEP-2640 limits a conforming host must accept; skills over them are not served. */
export declare const MCP_SKILL_MAX_RESOURCES = 512;
export declare const MCP_SKILL_MAX_TOTAL_BYTES: number;
/** The skills the feature serves and where their files are. */
export interface McpSkillSource {
    /** The agent's skills as `describe()` lists them. */
    readonly skills: readonly AgentSkillDescription[];
    readonly files: SkillFileSource;
}
/**
 * An MCP server feature publishing an agent's compiled skills per SEP-2640:
 * `skills/list`, `skills/get`, `resources/list`, `resources/templates/list`,
 * `resources/read`, and `resources/directory/read`, all under `skill://`.
 *
 * The feature owns the server's resource methods. They are set on the
 * low-level server rather than through `McpServer.registerResource`, whose
 * `resources/read` normalizes the URI with `new URL()` (which resolves `..`)
 * before matching.
 *
 * A skill is served whole or not at all, and an unserved skill is absent
 * from every method. It is served when:
 *
 * - its name and every file path are valid `skill://` segments, and exactly
 *   one top-level file is its entry (`SKILL.md` in any case, served as
 *   `SKILL.md`);
 * - it has at most 512 files, none over the 512 KiB skill file cap, and at
 *   most 16 MiB in total;
 * - every file reads, and the served `SKILL.md` frontmatter meets the Agent
 *   Skills format (name rules, description of 1-1024 characters).
 *
 * `SKILL.md` frontmatter that already carries the skill's `name` and a
 * `description` is served byte for byte. Otherwise (flat and module skills,
 * whose materialized `SKILL.md` has no frontmatter, or a package whose `name`
 * differs from its directory) the served document carries rewritten
 * frontmatter, and `frontmatter` and the digest describe that document.
 *
 * Snapshots are keyed by the `skills` array, which `describe()` keeps for
 * as long as the compiled artifacts stay the same, so a skill's files are
 * listed and read once per build: once per process in production, once per
 * recompile under `eve dev`.
 */
export declare function createMcpSkillsFeature(source: McpSkillSource): McpServerFeature;
/**
 * Parses `skill://<skill>[/<path>]` strictly. Rejected: other schemes, a
 * query or fragment, whitespace, backslashes, empty segments (so `//` and a
 * trailing `/`), `.` and `..` segments (decoded too), percent-encoded `/`,
 * `\`, or NUL, and malformed percent-encoding.
 */
export declare function parseSkillUri(uri: string): {
    readonly skill: string;
    readonly path?: string;
} | undefined;
