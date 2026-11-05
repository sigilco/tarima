import type { EventOfType } from './events.js';
/** A single run-attribute change. `null` removes the key. */
export interface AttributeChange {
    key: string;
    value: string | null;
}
export declare const RESERVED_ATTRIBUTE_KEY_PREFIX = "$";
export declare const ROOT_RUN_ID_ATTRIBUTE = "$rootRunId";
export declare const PARENT_RUN_ID_ATTRIBUTE = "$parentRunId";
/**
 * Reserved attribute carrying the caller's data-retention preference, seeded
 * by `start({ retention })`. Worlds read it when a run reaches a terminal
 * state to decide how long user data is kept. Absent means "the World
 * decides", which is also what `'default'` requests.
 *
 * The value is a duration written as a decimal integer, and **its unit is
 * deliberately not decided yet**. `'0'` is the only duration implemented,
 * and zero is the one value that means the same thing in every unit, so it
 * can ship ahead of that decision: it commits to a shape without committing
 * to a scale. A World that reads a non-zero value must treat it as
 * unsupported and fall back to its own default — that is the safe direction,
 * because it keeps data that was asked to be kept rather than deleting data
 * on the strength of a number it cannot scale.
 */
export declare const RETENTION_ATTRIBUTE = "$retention";
/**
 * Value accepted by `start({ retention })`, before it is encoded into
 * {@link RETENTION_ATTRIBUTE}.
 *
 * - `0` — delete user data as soon as the run reaches a terminal state.
 * - `'default'` — let the World decide; the same as omitting the option.
 *
 * A number rather than a string because the value is a duration and this
 * namespace is meant to grow. It is the literal `0` rather than `number`
 * because zero is the only duration that can be honored while the unit is
 * undecided: the narrow type is what stops a caller writing some other
 * duration and silently getting the World's default instead.
 */
export type RunRetention = 0 | 'default';
/** Wire value of {@link RETENTION_ATTRIBUTE} meaning "delete on finish". */
export declare const RETENTION_ZERO = "0";
/** Wire value meaning "use the World's default". Equivalent to absence. */
export declare const RETENTION_DEFAULT = "default";
/** How a World should treat a run's {@link RETENTION_ATTRIBUTE}. */
export interface ResolvedRunRetention {
    /** `'none'` deletes user data at terminal; `'default'` keeps it. */
    mode: 'none' | 'default';
    /** The raw attribute value, when the run carried one. */
    raw?: string;
    /**
     * True when the value parsed as a non-negative integer — which for every
     * value except `0` still means unsupported. Deliberately not the parsed
     * number: there is no unit to interpret it in yet (see
     * {@link RETENTION_ATTRIBUTE}), and exposing one invites a caller to guess.
     */
    wellFormed: boolean;
    /** True when this is a value no World implements today. */
    unsupported: boolean;
}
/**
 * Resolve a run's retention preference from its attributes.
 *
 * Shared by every World that implements retention, and that sharing is the
 * point: two Worlds with independently written parsers can drift, and drift
 * here means one World deleting a run another keeps. The safe direction is
 * fixed — anything but `'0'` resolves to `'default'`, so a value this version
 * does not understand keeps the data rather than destroying it.
 */
export declare function readRunRetention(attributes: Record<string, string> | undefined): ResolvedRunRetention;
/**
 * Whether a finished run asked for its user data to be deleted now.
 *
 * The predicate most World call sites want. `readRunRetention` is there when
 * a caller also needs to report *why* it declined — an unsupported value is a
 * rollout signal worth surfacing, not just a no-op.
 */
export declare function purgesUserDataOnFinish(attributes: Record<string, string> | undefined): boolean;
export declare const ATTRIBUTE_KEY_MAX_LENGTH = 256;
export declare const ATTRIBUTE_VALUE_MAX_BYTES = 256;
export declare const ATTRIBUTE_MAX_PER_RUN = 64;
/** World attr_set limit for JSON-serialized eventData, not just attribute values. */
export declare const ATTRIBUTE_EVENT_DATA_MAX_BYTES = 8192;
/** A validation failure that callers can translate at their API boundary. */
export declare class AttributeValidationError extends Error {
    constructor(message: string);
}
/** Validate writes without applying a new constraint to persisted event schemas. */
export declare function validateAttributeEventDataSize(eventData: EventOfType<'attr_set'>['eventData']): void;
/** Validates constraints that apply across a batch of individually valid changes. */
export declare function validateAttributeBatchConstraints(changes: AttributeChange[], context?: {
    /** Existing keys make the post-merge count exact. */
    existingKeys?: Iterable<string>;
}): void;
export declare function validateAttributeChanges(changes: AttributeChange[], context?: {
    /** Existing keys make the post-merge count exact. */
    existingKeys?: Iterable<string>;
    /** Reserved `$` keys are only available to framework code. */
    allowReservedAttributes?: boolean;
}): void;
export declare function applyAttributeChanges(existing: Record<string, string> | undefined, changes: AttributeChange[]): Record<string, string>;
//# sourceMappingURL=attributes-validation.d.ts.map