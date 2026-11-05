/**
 * `eve__search`: finds catalog entries, the agent's deferred tools and skills
 * and every connection tool, by keyword. It never prompts: a connection whose
 * tools need sign-in is found as its sign-in entry instead. Its definition is
 * fixed for each eve version, so the catalog can change without changing the model's
 * tool list.
 */
import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import type { ConnectionRegistry } from "#runtime/connections/registry-types.js";
import type { CatalogSkill } from "./skills.js";
/** What an agent's search can return, from what it declares. */
export interface SearchReach {
    readonly connections: boolean;
    readonly skills: boolean;
    readonly tools: boolean;
}
/**
 * Builds `eve__search` over one step's deferred entries and skills and the
 * connections in `registry`. `describe` returns an entry's description as the
 * model would read it in its tool list.
 */
export declare function createSearchTool(input: {
    readonly deferred: readonly HarnessToolDefinition[];
    readonly describe: (definition: HarnessToolDefinition) => string;
    readonly reach: SearchReach;
    readonly registry: ConnectionRegistry | undefined;
    readonly skills: readonly CatalogSkill[];
}): HarnessToolDefinition;
