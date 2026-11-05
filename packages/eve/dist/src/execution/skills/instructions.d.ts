import type { CatalogSkill } from "#execution/catalog/skills.js";
import type { Announcement } from "#harness/announcements.js";
export interface AvailableSkillDescription {
    readonly description: string;
    readonly name: string;
    /** False when the skill has no sandbox files; its path is omitted. */
    readonly hasFiles?: boolean;
}
/**
 * Formats the "Available skills" section: every skill that isn't deferred,
 * with the instruction to load it. Deferred skills stay out of context until
 * search finds them.
 *
 * A loaded skill's instructions are never injected into the system prompt;
 * the model has them from the result of loading it. The formatter uses the
 * canonical symbolic skill root so supporting files remain discoverable
 * without provisioning a sandbox.
 *
 * eve's default prompt renders it for the agent's static skills on every model
 * call (`definitions/skills.ts`). Dynamic skills reuse it for their announcement.
 */
export declare function formatAvailableSkillsSection(skills: readonly AvailableSkillDescription[]): string | null;
/**
 * Announces the dynamic skills that aren't deferred, in full whenever they
 * change. Nothing is announced until the first one resolves.
 */
export declare function dynamicSkillAnnouncements(dynamic: readonly CatalogSkill[]): Readonly<Record<string, Announcement>>;
/** Where a skill's `SKILL.md` lives under the model's skill root. */
export declare function skillFilePath(name: string): string;
