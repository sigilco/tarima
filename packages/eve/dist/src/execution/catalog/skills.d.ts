/**
 * Skills in the catalog. Every skill the session can see loads through
 * `eve__skill({ name })`, deferred or not. The call resolves to one loader entry
 * whose name sits outside the tool namespace, because skills and tools have
 * separate names.
 */
import type { HarnessToolDefinition } from "#harness/execute-tool.js";
/** A skill the session can load. */
export interface CatalogSkill {
    readonly deferred: boolean;
    readonly description: string;
    /** The instructions loading returns. */
    readonly markdown: string;
    readonly name: string;
    /** The skill's `SKILL.md` under the skills root, when it has package files. */
    readonly path?: string;
    /** The dynamic definition that offers it; the agent's own skills have none. */
    readonly source?: string;
}
/** The entry every `eve__skill` call resolves to, with the call's own `{ name }` input. */
export declare function createSkillLoader(skills: ReadonlyMap<string, CatalogSkill>): HarnessToolDefinition;
/** Why `eve__skill` can't load `name`: the closest skills, or the connection it names. */
export declare function unknownSkillMessage(name: string, skills: ReadonlyMap<string, CatalogSkill>, connections: readonly string[], searchable: boolean): string;
