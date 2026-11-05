import type { ContextContainer } from "#context/container.js";
import type { ResolvedHookDefinition } from "#runtime/types.js";
import type { WrittenEvent } from "#execution/publish-session-events.js";
import { type DefinitionsState } from "#definitions/state.js";
import type { Definition } from "./definition.js";
/**
 * An authored hook: after every commit, its handlers run once for each fact of their type, typed
 * handler first, then `*`. Its occurrence identifies the fact for external services that support
 * idempotency.
 */
export declare function hookDefinition(hook: ResolvedHookDefinition): Definition;
/** After a commit's effects: acts on the cancels hooks asked for, and drops what no longer holds. */
export declare function settleHookCommands(ctx: ContextContainer, definitions: readonly Definition[], input: {
    readonly written: readonly WrittenEvent[];
    readonly cancelTurn?: Parameters<typeof actOnCancels>[2];
}): void;
/**
 * Stops the running turn for the first cancel that targets it, and drops cancels and failures
 * whose turn has ended. One the commit can't act on waits for a commit that can, while its turn
 * still runs.
 */
declare function actOnCancels(ctx: ContextContainer, definitions: readonly Definition[], cancelTurn: ((cancel: {
    readonly hook: string;
    readonly reason?: string;
}) => void) | undefined): void;
/**
 * A cancel from a hook before its turn opened stops the turn its input opens. The next turn to
 * start is that turn only if one of the cancelled deliveries caused it; input the session ignored
 * opens no turn, so an unrelated turn just clears the record. Bound before the commit's hooks
 * see the turn settle.
 */
export declare function bindOpeningCancel(state: DefinitionsState, written: readonly WrittenEvent[]): DefinitionsState;
export {};
