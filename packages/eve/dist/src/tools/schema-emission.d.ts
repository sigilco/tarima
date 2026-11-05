import type { StandardJSONSchemaV1 } from "#compiled/@standard-schema/spec/index.js";
import { type JsonObject } from "#shared/json.js";
import type { ToolSchemaSource } from "#tools/schema.js";
export type SchemaDirection = "input" | "output";
/** `null` and `undefined` pass through every conversion untouched. */
export type SchemaResult<TSource, TResult> = TSource extends null | undefined ? TSource : TResult;
type JsonSchemaEmitter = StandardJSONSchemaV1.Converter[SchemaDirection];
/**
 * Serializes an output schema source into canonical JSON Schema data (no
 * `$schema` key) for compiled artifacts, durable state, and protocol
 * responses. `null` and `undefined` pass through untouched.
 */
export declare function serializeOutputSchema<T extends ToolSchemaSource | null | undefined>(source: T): SchemaResult<T, JsonObject>;
/**
 * Normalizes one source into canonical JSON Schema data. Standard Schemas
 * emit their requested direction; plain data passes through. The `$schema`
 * version key is always stripped so every eve boundary carries one canonical
 * wire form.
 */
export declare function emitJsonSchema(source: ToolSchemaSource, direction: SchemaDirection): JsonObject;
export declare function readJsonSchemaEmitter(standard: Record<string, unknown>, direction: SchemaDirection): JsonSchemaEmitter | undefined;
export declare function getStandardSchemaProperties(value: unknown): Record<string, unknown> | undefined;
export {};
