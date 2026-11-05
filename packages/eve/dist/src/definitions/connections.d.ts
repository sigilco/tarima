import type { ContextReader } from "#context/key.js";
import type { ResolvedDynamicDefinition } from "#runtime/types.js";
import { type Definition } from "./definition.js";
/** The agent's connections: the session's registry, its own and those its dynamic files keep. */
export declare const connections: Definition;
/**
 * A `defineDynamic()` in `agent/connections/`: one connection named after the file, or a map. What
 * it keeps reaches the model through the session's registry, which it installs. Callbacks are
 * rebuilt even when the target is unchanged: the current policy can have changed.
 */
export declare function connectionDefinition(resolver: ResolvedDynamicDefinition<"connection">): Definition;
/** Installs the slots' connections in the step's registry, which starts with the static ones. */
export declare function installDynamicConnections(ctx: Pick<ContextReader, "get">): Promise<void>;
/**
 * Every connection name the session has: the agent's own, and those dynamic connections this
 * evaluation already kept. The registry still holds the last call's dynamic connections until
 * every connection has evaluated and it installs them again.
 */
export declare function sessionConnectionNames(ctx: Pick<ContextReader, "get">): readonly string[];
/** The version of each dynamic connection, by name: what it reaches, and its memo results. */
export declare function dynamicConnectionVersions(ctx: Pick<ContextReader, "get">): ReadonlyMap<string, string>;
