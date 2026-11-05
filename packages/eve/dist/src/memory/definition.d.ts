import type { SessionAuthContext } from "#channel/types.js";
import { type JsonValue } from "#shared/json.js";
import type { ContextContainer } from "#context/container.js";
import type { SessionFrame } from "#dynamic/definition.js";
import { type MemoryInstrumentation } from "#instrumentation/memory.js";
import { type MemoryScope } from "#public/memory/index.js";
import type { ResolvedMemoryDefinition } from "#runtime/types.js";
import { type NormalizedMemoryRecallMessage } from "#shared/memory-state.js";
import { type Definition, type InternalContext } from "#definitions/definition.js";
export declare function bindMemoryInstrumentation(ctx: ContextContainer, instrumentation: MemoryInstrumentation | undefined): void;
/**
 * A `defineMemory()` slot. Recall runs before the first model call of each turn, and what it
 * brings back joins what earlier turns' recalls brought, which the slot keeps: each model call
 * reads every turn's recall just ahead of that turn's input, where earlier calls read it, so the
 * prompt ahead of it stays cached. A message with an `id` replaces the one with that `id` an
 * earlier turn recalled. A clear or a new scope starts over. Capture runs after the commit that
 * completes a turn, and before a compaction rewrites the history it captures: a failure there
 * fails the compaction. The provider's tools are {@link memoryToolsDefinition}'s.
 */
export declare function memoryDefinition(memory: ResolvedMemoryDefinition): Definition;
/** One turn's recall, as `record` returns it. */
interface RecallRecord {
    /** The latest clear when it recalled: a clear starts over. */
    readonly cleared: number | null;
    readonly result: unknown;
    /** The scope it recalled under: another scope starts over. */
    readonly scope: string;
    readonly turnId: string;
}
interface RecalledMessage {
    readonly content: string;
    readonly id?: string;
}
interface RecallBatch {
    readonly turnId: string;
    readonly messages: readonly RecalledMessage[];
}
/** What a slot's recalls brought, for the session so far: each turn's, in turn order. */
interface Recalls {
    readonly cleared: number | null;
    readonly scope: string;
    readonly batches: readonly RecallBatch[];
}
/**
 * Joins a turn's recall to what earlier turns' recalls brought. A message with an `id` an earlier
 * turn recalled replaces it, unless its content is the same; a recall for a turn that already has
 * one, as on a new deployment, replaces that turn's.
 */
export declare function accumulate(previous: JsonValue, recalled: RecallRecord, messages: readonly NormalizedMemoryRecallMessage[]): Recalls;
/** What resolving a memory slot's scope reads. */
export interface ScopeContext {
    readonly abortSignal: AbortSignal;
    readonly channel: SessionFrame["channel"];
    readonly ctx: InternalContext["ctx"];
    readonly session: Pick<SessionFrame["session"], "auth" | "id">;
}
/** The scope a memory slot operates under for this session, or `null` when it's disabled. */
export declare function resolveMemoryScope(memory: Pick<ResolvedMemoryDefinition, "namespace" | "scope" | "slot">, ctx: ScopeContext): Promise<MemoryScope | null>;
/**
 * Who the session acts for, as a memory selection reads it: the whole principal, since a scope
 * tells principals apart by type, authenticator, issuer, and id, and an authored scope can read
 * its attributes too. Two principals that share an id never share a selection.
 */
export declare function principalOf(ctx: Pick<SessionFrame, "session">): SessionAuthContext | null;
/**
 * A memory's provider tools, named `<slot>__<key>`, as the tool file `agent/tools/<slot>.ts`
 * would offer them, which replaces or disables them where the agent declares it.
 */
export declare function memoryToolsDefinition(memory: ResolvedMemoryDefinition): Definition;
export {};
