import type { JsonObject, JsonValue } from "#protocol/session-events/json.js";
export type { JsonArray, JsonObject, JsonPrimitive, JsonValue, } from "#protocol/session-events/json.js";
/** Compares two already-validated JSON structures by value. */
export declare function jsonValuesEqual(left: unknown, right: unknown): boolean;
/**
 * Returns the normalized JSON value for one runtime payload.
 *
 * Object properties whose value is `undefined` are treated as omitted so
 * callers can pass normal JavaScript option bags without tripping the JSON
 * boundary on absent optional fields. Lossy JavaScript values such as `Date`,
 * `Map`, `Set`, `NaN`, and cyclic structures are rejected.
 */
export declare function parseJsonValue(value: unknown): JsonValue;
/**
 * Returns the normalized JSON object for one runtime payload.
 *
 * Top-level arrays and primitives are rejected. Object properties whose
 * value is `undefined` are treated as omitted.
 */
export declare function parseJsonObject(value: unknown): JsonObject;
/**
 * Narrows an already-normalized {@link JsonValue} to a {@link JsonObject}.
 */
export declare function isJsonObjectValue(value: JsonValue | undefined): value is JsonObject;
