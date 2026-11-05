/**
 * The step's catalog: what a model step can run, and how the model reaches it. The step's tools
 * that aren't deferred go into the model's tool list, in the order its definitions made them,
 * routes such as `eve__tool` among them, whose calls become calls to the entries they name. A call
 * resolves to its entry here and then runs exactly as a direct call would, so only model history
 * ever names a route.
 */
import type { ToolTable } from "#definitions/definition.js";
import type { ContextReader } from "#context/key.js";
import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import type { CallResolver, HarnessSession, HarnessToolLookup, HarnessToolMap } from "#harness/types.js";
import type { ConnectionRegistry } from "#runtime/connections/registry-types.js";
import type { ResolvedConnectionDefinition } from "#runtime/types.js";
import { type CatalogSkill } from "./skills.js";
/** What a step can run: its tools as the session sees them, with its connections and skills. */
export interface Callable {
    /** Every direct and deferred entry the session sees, connection tools aside. */
    readonly entries: HarnessToolMap;
    /** Entries the model's tool list leaves out, connection tools aside. */
    readonly deferred: HarnessToolMap;
    readonly connections: readonly ResolvedConnectionDefinition[];
    /** Every skill the session can load, deferred or not. */
    readonly skills: ReadonlyMap<string, CatalogSkill>;
    /**
     * The step's connections, read once: a route's validation runs while the SDK parses the
     * stream, where the context store may not be active.
     */
    readonly registry: ConnectionRegistry | undefined;
    /** An entry by name: one of `entries`, or a connection's tool or sign-in. */
    get(name: string): HarnessToolDefinition | undefined;
    /** An entry's description as the model reads it, with the notes eve appends. */
    describe(definition: HarnessToolDefinition): string;
}
export interface StepCatalog extends HarnessToolLookup {
    /** The model's tool list: every entry that isn't deferred, routes among them. */
    readonly advertised: HarnessToolMap;
    readonly connections: readonly ResolvedConnectionDefinition[];
    /** Entries reached only through a route, connection tools aside. */
    readonly deferred: HarnessToolMap;
    /** Every direct and deferred entry the session sees, connection tools aside. */
    readonly entries: HarnessToolMap;
    /** Every skill the session can load, deferred or not. */
    readonly skills: ReadonlyMap<string, CatalogSkill>;
    /** An entry's description as the model reads it, with the notes eve appends. */
    describe(definition: HarnessToolDefinition): string;
    /**
     * Resolves a model tool call to the entry it runs: a route's call becomes the call to the entry
     * it names, and any other call runs the listed tool it names. A call that reaches none of these
     * resolves to nothing.
     */
    readonly resolve: CallResolver;
}
/** What a step's tools are, and where it runs them. */
export interface CatalogInput {
    /** What the step's definitions offer: tools by name, connections, and skills. */
    readonly table: ToolTable;
    readonly ctx: ContextReader;
    /** Whether `endsTurn` applies: a root turn without an output schema. */
    readonly endsTurn: boolean;
    readonly session: Pick<HarnessSession, "rootSessionId">;
}
/** What a step's tools can run, keeping only what the session sees: routes run nothing. */
export declare function callableOf(input: CatalogInput): Callable;
/** The step's catalog: what its tools can run, and the model's tool list. */
export declare function buildStepCatalog(input: CatalogInput): StepCatalog;
/**
 * Whether the session offers tasks: one of the agent's own tools it sees starts them, or the agent
 * resolves subagents at runtime. Both are fixed by the deployment.
 */
export declare function sessionOffersTasks(input: {
    readonly ctx: ContextReader;
    readonly session: Pick<HarnessSession, "rootSessionId">;
    readonly tools: readonly HarnessToolDefinition[];
}): boolean;
