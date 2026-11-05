import type { ContextContainer } from "#context/container.js";
import type { ContextReader } from "#context/key.js";
import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import type { ResolvedDynamicDefinition } from "#runtime/types.js";
import { type Definition, type InternalContext, type Kept, type ToolEntry } from "./definition.js";
/**
 * The agent's `defineTool()` files: the same tools in every session, so they keep nothing. The step
 * holds them, as it runs them outside a turn too; each joins the call like any other tool.
 */
export declare const staticTools: Definition;
/**
 * A `defineDynamic()` in `agent/tools/`: one tool named after the file, or a map of them. It keeps
 * what the model is offered; the tools themselves are code. Its tools take their names from the
 * agent's own.
 */
export declare function toolDefinition(resolver: ResolvedDynamicDefinition<"tool">): Definition;
/**
 * Tools `evaluate` makes, as the tool file `source` names would: a `defineDynamic()` tool file's,
 * or an eve feature's, which offers its tools under the file it would take, such as a memory
 * slot's. Their versions are kept under that file's ID.
 */
export declare function toolsDefinition(source: ToolSource, evaluate: (ctx: InternalContext) => unknown): Definition;
/** The names of the dynamic tools the session keeps, live or not. */
export declare function dynamicToolNames(ctx: Pick<ContextReader, "get">): readonly string[];
export declare function toolEntries(definitions: readonly HarnessToolDefinition[], source?: string): Map<string, ToolEntry>;
/** Where dynamic tools come from: a file, by its slug, in an extension's namespace or none. */
export interface ToolSource {
    readonly extensionNamespace?: string;
    readonly logicalPath: string;
    readonly slug: string;
}
/** The tools `result` defines, checked and named as `source`'s, with their declarations. */
export declare function contributeTools(source: ToolSource, result: unknown, ctx: ContextContainer): Kept;
