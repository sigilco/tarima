import type { DynamicKey, Memo } from "#dynamic/definition.js";
import type { JsonValue } from "#shared/json.js";
/** A key's canonical JSON form and its digest. */
export declare function keyOf(key: DynamicKey, label: string, method: string): {
    readonly digest: string;
};
/** One scope's memos for one evaluation. */
export interface MemoRun {
    readonly memo: Memo;
    /** The records this evaluation used, by key digest: what the scope keeps when it succeeds. */
    used(): Readonly<Record<string, JsonValue>>;
    /** The evaluation settled: a later call throws. */
    close(): void;
}
export declare function openMemos(input: {
    /** What the records belong to: a definition, or a hook's handler. */
    readonly scope: string;
    /** The file, for errors. */
    readonly label: string;
    readonly sessionId: string;
    readonly abortSignal: AbortSignal;
    /** The records the scope kept. */
    readonly kept: Readonly<Record<string, JsonValue>> | undefined;
    /**
     * Set when eve restores rather than evaluates: a key without a kept record fails with this
     * message, instead of running.
     */
    readonly restoring?: string;
    /** A deployment change discarded the scope's memos, so a missing key runs for that reason. */
    readonly afterDeployment?: boolean;
}): MemoRun;
/**
 * Checks that `value` is JSON, naming the path and type of the first part that isn't, such as
 * `Date at $.accounts[2].createdAt`. A result property whose value is `undefined` is left out, as
 * `JSON.stringify` does; a key's is rejected, since `{ tenantId: undefined }` would otherwise
 * share `{}`'s memo.
 */
export declare function toJson(value: unknown, subject: string, options?: {
    readonly key?: boolean;
}): JsonValue;
