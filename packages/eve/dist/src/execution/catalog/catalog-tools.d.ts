/**
 * eve's catalog tools: `eve__search` finds entries, `eve__tool` routes to deferred entries and
 * connection tools, and `eve__skill` routes to the skill loader.
 */
import type { OfferedCatalogTools } from "#context/keys.js";
import type { ToolEntry } from "#definitions/definition.js";
import type { Announcement } from "#harness/announcements.js";
import type { Callable } from "./step-catalog.js";
/**
 * The catalog tools what the step can run reaches: `eve__tool` a deferred tool or agent, or a
 * connection; `eve__skill` any skill; and `eve__search` anything it could find, which is whatever
 * `eve__tool` calls plus deferred skills. What a step reaches includes what its dynamic resolvers
 * returned, so a resolver that returns only listed tools adds none.
 */
export declare function catalogReach(callable: Callable): OfferedCatalogTools;
/** The catalog tools `offered` names, over what `callable` runs, in the order the model sees them. */
export declare function catalogTools(callable: Callable, offered: OfferedCatalogTools, announcements: {
    /** What `eve__search` reaches. */
    readonly catalog: Readonly<Record<string, Announcement>>;
    /** The skills `eve__skill` loads that the prompt doesn't list. */
    readonly skills: Readonly<Record<string, Announcement>>;
}): ReadonlyMap<string, ToolEntry>;
