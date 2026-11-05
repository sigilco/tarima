import type { ContextReader } from "#context/key.js";
import { ContextKey } from "#context/key.js";
import type { AlsContext } from "#context/container.js";
import type { JsonValue } from "#shared/json.js";
import { type Continuation } from "./continuation.js";
/** One dynamic value as installed. */
export interface Slot {
    /** The value's JSON form: what readers of data kinds read. */
    readonly value: JsonValue;
    /** The digest of `value`, which equality compares. */
    readonly digest: string;
    /** The line after which the slot last changed. */
    readonly since: number;
    /** The value carries code, which a process that didn't build it builds by evaluating again. */
    readonly live?: true;
}
export interface DefinitionsState {
    readonly slots: Readonly<Record<string, Slot>>;
    /**
     * Memo results, by memo scope (a definition, or a hook's handler) and key digest: the keys the
     * scope's latest evaluation used. Discarded when the session moves to another deployment.
     */
    readonly memos?: Readonly<Record<string, Readonly<Record<string, JsonValue>>>>;
    /** Memo scopes a deployment change discarded, until each succeeds again: for diagnostics. */
    readonly discarded?: readonly string[];
    /** The latest line of each event type, plus `"*"` for the latest fact. */
    readonly latest: Readonly<Record<string, number>>;
    /** When the latest commit was written, as ISO 8601: `ctx.now`. */
    readonly at?: string;
    /** The runtime revision the latest step ran; memos made under another are discarded. */
    readonly revision?: string;
    /** Commands hooks queued for the running turn that the session hasn't acted on yet. */
    readonly intents?: readonly PendingIntent[];
    /** The continuation hooks queued for the turn that settled, until the session admits or drops it. */
    readonly continuation?: Continuation;
    /** The turn a hook's cancel stopped: a cancel acts once on its turn. */
    readonly cancelledTurnId?: string;
    /** The hook whose cancel stopped `cancelledTurnId`, which may continue the turn. */
    readonly cancelledBy?: string;
    /**
     * A hook that cancelled input before its turn opened, with the deliveries that commit admitted,
     * until the next turn starts: that turn is the one it cancelled only if one of them caused it.
     */
    readonly cancelledOpening?: {
        readonly by: string;
        readonly deliveryIds: readonly string[];
    };
}
/** A command a hook queued for the running turn, waiting for the session to act on it. */
export interface PendingIntent {
    /** The hook that queued it. */
    readonly reactionId: string;
    /** The occurrence it acts for, for diagnostics. */
    readonly occurrence: string;
    /** `fail` is eve's own: a hook failed during the turn, which fails at its next boundary. */
    readonly type: "cancel" | "fail";
    readonly reason?: string;
    /** For a cancel or failure, the turn running when the hook ran: never a later one. */
    readonly turnId?: string;
}
export declare const DefinitionsStateKey: ContextKey<DefinitionsState>;
export declare function readDefinitionsState(ctx: Pick<ContextReader, "get">): DefinitionsState;
export declare function writeDefinitionsState(ctx: AlsContext, state: DefinitionsState): void;
/**
 * The most one scope's memos take, in UTF-8 bytes of the JSON map from key digest to result that
 * every step of the session carries in its checkpoint: a few results at the 1 MB per-result cap.
 */
export declare const MEMOS_CAP: number;
export declare function memoBytes(result: JsonValue): number;
/** A scope's evaluation succeeded: it keeps the memos it used, and only those. */
export declare function keepMemos(ctx: AlsContext, scope: string, used: Readonly<Record<string, JsonValue>>): void;
/** Whether a deployment change discarded `scope`'s memos and it hasn't succeeded since. */
export declare function discardedByDeployment(ctx: Pick<ContextReader, "get">, scope: string): boolean;
/**
 * A scope's evaluation failed: the memos that ran are still valid observations, so it keeps them
 * beside what it had. Failures in a row can't grow it past `MEMOS_CAP`: once they would, it keeps
 * only what it had, which what's installed was built from, and the new memos run again.
 */
export declare function mergeMemos(ctx: AlsContext, scope: string, used: Readonly<Record<string, JsonValue>>): void;
/**
 * A slot's value in the shape its kind wrote. The kind checked it when it contributed, so the
 * session holds only values of that shape: each kind reads its own slots, never another's.
 */
export declare function slotValueOf<T>(value: JsonValue | null | undefined): T;
/** A stable digest of a JSON value. */
export declare function digestOf(value: JsonValue): string;
export declare function canonicalJson(value: JsonValue): string;
export declare function sessionIdOf(ctx: Pick<ContextReader, "get">): string;
/** The slot's live value, when this process built it for the value the slot holds. */
export declare function readLive(ctx: Pick<ContextReader, "get">, id: string, slot: Slot): {
    readonly live: unknown;
} | undefined;
export declare function writeLive(ctx: Pick<ContextReader, "get">, id: string, slot: Slot, live: unknown): void;
export declare function clearLive(ctx: Pick<ContextReader, "get">, id: string): void;
/** Drops a session's live values, as a fresh process wouldn't have them. */
export declare function forgetSessionLive(sessionId: string): void;
/**
 * The slots of one kind, in the order each was first written, with their live values where this
 * process has them. A model call reads what definitions contribute, never another's slot; this is
 * for what applies a kind to the process or sandbox, and for readers outside a model call, such as
 * a dispatch step that needs the subagent a session selected.
 */
export declare function slotsOf(ctx: Pick<ContextReader, "get">, kind: string): readonly {
    readonly id: string;
    readonly slot: Slot;
    readonly live?: unknown;
}[];
/**
 * Versions for the entries one slot offers: each entry's JSON form with the memo results its
 * definition was built from. A parked call compares its entry's version before it runs.
 */
export declare function entryVersions(ctx: Pick<ContextReader, "get">, id: string): (offered: JsonValue) => string;
export declare function readSlot(ctx: Pick<ContextReader, "get">, id: string): Slot | undefined;
