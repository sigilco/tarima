import type { ContextReader } from "#context/key.js";
import type { DurableDynamicSubagentSelection } from "#context/keys.js";
import { type ResolvedDynamicSubagentResolver } from "#runtime/subagents/registry.js";
import { type Definition } from "./definition.js";
type Selection = Exclude<DurableDynamicSubagentSelection, null>;
/**
 * A dynamic `subagents/<name>/agent.ts`: `defineAgent(...)`, `defineRemoteAgent(...)`, or `null`. It
 * keeps the selection, and offers the model a tool for it unless its `tool` is `false`.
 */
export declare function subagentDefinition(resolver: ResolvedDynamicSubagentResolver): Definition;
/**
 * The dynamic subagents the session's slots select, by node id. A remote agent with credentials
 * carries the binding a child opened now keeps, from which they're built again.
 */
export declare function readDynamicSubagentSelections(ctx: ContextReader): Readonly<Record<string, Selection>>;
export {};
