/**
 * Structural deltas between serializable values.
 *
 * `applyValueDelta(base, diffValue(base, next))` rebuilds `next` as a
 * serializer sees it: the same entries, in the same key order, including
 * entries whose value is `undefined`. Plain objects, null-prototype ones
 * included, and arrays change entry by entry, so the result shares every
 * unchanged entry with `base`. Any other value is compared by identity and
 * carried whole when it differs, so such values must be replaced rather than
 * edited in place.
 */
export type ValueDelta = {
    readonly kind: "value";
    readonly value: unknown;
} | (EntryChanges & {
    readonly kind: "object";
    /**
     * The next object's keys, present only when they are not the base's keys
     * followed by the added ones: an entry was removed or the order changed.
     */
    readonly keys?: readonly string[];
}) | (EntryChanges & {
    readonly kind: "array";
    readonly length: number;
});
/** Entry changes by key or index: whole next values in `set`, nested deltas in `patch`. */
interface EntryChanges {
    readonly patch?: Readonly<Record<string, ValueDelta>>;
    readonly set?: Readonly<Record<string, unknown>>;
}
/**
 * Copies every plain object and array in `value` and keeps any other value by
 * reference, so editing `value` in place afterwards leaves the copy intact.
 */
export declare function snapshotValue<T>(value: T): T;
/** The delta from `base` to `next`, or `undefined` when they are equal. */
export declare function diffValue(base: unknown, next: unknown): ValueDelta | undefined;
/** Applies a delta from {@link diffValue} to the value it was computed against. */
export declare function applyValueDelta<T>(base: T, delta: ValueDelta | undefined): T;
export {};
