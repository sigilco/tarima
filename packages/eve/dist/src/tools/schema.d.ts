import { type FlexibleSchema } from "ai";
import type { StandardJSONSchemaV1, StandardSchemaV1 } from "#compiled/@standard-schema/spec/index.js";
import { type JsonObject } from "#shared/json.js";
import { type SchemaDirection, type SchemaResult } from "#tools/schema-emission.js";
export { serializeOutputSchema } from "#tools/schema-emission.js";
/**
 * eve-owned schema contract for tool input and output schemas: a Standard
 * Schema validator that can also emit JSON Schema. Author schemas (Zod,
 * Valibot, ArkType) implement it directly; plain JSON Schema data is lowered
 * onto it by {@link defineJsonSchema}.
 */
export type ToolSchema<Input = unknown, Output = Input> = StandardSchemaV1<Input, Output> & StandardJSONSchemaV1<Input, Output>;
/**
 * Any value accepted at a schema boundary: a live {@link ToolSchema}, a Zod 3
 * Standard Schema, a JSON-Schema-capable Standard Schema, or plain JSON Schema
 * data. Plain data is runtime-validated by {@link parseJsonObject} during
 * conversion.
 */
export type ToolSchemaSource = StandardJSONSchemaV1 | StandardSchemaV1 | Record<string, unknown>;
/**
 * Resolves a source into a live input {@link ToolSchema}. Live schemas pass
 * through unchanged; plain JSON Schema data becomes a {@link defineJsonSchema}
 * schema. `null` and `undefined` pass through untouched.
 */
export declare function toInputSchema<T extends ToolSchemaSource | null | undefined>(source: T): SchemaResult<T, ToolSchema>;
/**
 * Resolves a source into a live output {@link ToolSchema}. Live schemas pass
 * through unchanged; plain JSON Schema data becomes a {@link defineJsonSchema}
 * schema. `null` and `undefined` pass through untouched.
 */
export declare function toOutputSchema<T extends ToolSchemaSource | null | undefined>(source: T): SchemaResult<T, ToolSchema>;
/**
 * Serializes an input schema source into canonical JSON Schema data (no
 * `$schema` key) for compiled artifacts, durable state, and protocol
 * responses. `null` and `undefined` pass through untouched.
 */
export declare function serializeInputSchema<T extends ToolSchemaSource | null | undefined>(source: T): SchemaResult<T, JsonObject>;
/**
 * Serializes an input schema into the JSON Schema eve sends a model for it.
 * A schema from a validation library such as Zod, Valibot, or ArkType gets
 * `additionalProperties: false` on every object that allows no other keys, as
 * the AI SDK applies to library schemas. Plain JSON Schema is sent exactly as
 * written. `null` and `undefined` pass through untouched.
 *
 * Providers can transform the schema further before the model reads it.
 */
export declare function serializeModelInputSchema<T extends ToolSchemaSource | null | undefined>(source: T): SchemaResult<T, JsonObject>;
/**
 * Returns whether a value implements the full {@link ToolSchema} contract:
 * Standard Schema validation plus JSON Schema emission.
 */
export declare function isToolSchema(value: unknown): value is ToolSchema;
/**
 * Builds a {@link ToolSchema} from plain JSON Schema data. The schema is
 * advertised exactly as given, and values are validated against it with a
 * JSON Schema 2020-12 validator that also accepts draft-07 constructs.
 *
 * `format` is treated as an annotation, as JSON Schema 2020-12 specifies by
 * default. A valid value's omitted properties receive their `default` values.
 * A schema the validator cannot evaluate faithfully (unknown `type`
 * names, invalid `pattern` expressions, unresolvable `$ref`s) is still
 * advertised, but its values pass through unvalidated; the tool's executor,
 * such as a remote MCP server, remains the authority for its own contract.
 *
 * `check` runs after the JSON Schema accepts a value and reports a message
 * for constraints JSON Schema cannot express.
 */
export declare function defineJsonSchema<T = unknown>(schema: JsonObject, check?: (value: T) => string | undefined): ToolSchema<T>;
/**
 * A JSON Schema advertised exactly as written whose accepted values `refine`
 * then checks further, rejecting them or returning the value to use.
 */
export declare function refineJsonSchema(schema: JsonObject, refine: (value: unknown) => Promise<StandardSchemaV1.Result<unknown>>): ToolSchema;
/**
 * A JSON Schema advertised exactly as written whose values `prepare` repairs
 * before validation, for argument shapes models are known to send instead.
 */
export declare function prepareJsonSchema<T = unknown>(schema: JsonObject, prepare: (value: unknown) => unknown): ToolSchema<T>;
/** An optional string property added to an input schema. */
export interface OptionalStringProperty {
    readonly description: string;
    readonly name: string;
}
/**
 * Extends an object input schema with an optional string property that the
 * schema itself never sees: validation splits the property off, validates the
 * rest with `schema`, and returns the property alongside the result. A plain
 * JSON Schema stays advertised as written.
 */
export declare function withOptionalStringProperty(schema: ToolSchema, property: OptionalStringProperty): ToolSchema;
/**
 * Permissive schema lowered onto model-visible tools whose definitions
 * declare no input schema. Accepts any input — an absent schema declares no
 * contract, so rejecting stray properties would only force needless retries.
 */
export declare const UNSPECIFIED_INPUT_SCHEMA: ToolSchema;
/**
 * Lowers a harness tool schema onto the AI SDK boundary.
 *
 * Every Standard Schema is wrapped in an AI SDK `jsonSchema()` schema whose
 * JSON Schema and validation both come from the schema's own library. The
 * AI SDK treats an existing `Schema` as final, so it never reaches for the
 * app's `zod` copy to convert or parse a schema built by another copy — a
 * mismatch that crashes JSON Schema conversion across Zod minor versions.
 * AI SDK-native schemas (already wrapped, or lazy) pass through.
 *
 * Library schemas get the object closing the AI SDK applies to them itself;
 * plain JSON Schema from {@link defineJsonSchema} is advertised as written.
 */
export declare function toModelSchema(schema: FlexibleSchema, direction: SchemaDirection): FlexibleSchema;
export declare function toModelSchema(schema: FlexibleSchema | undefined, direction: SchemaDirection): FlexibleSchema | undefined;
/** Yields a subschema, then each local `$ref` target it chains through. */
export declare function followRefs(root: JsonObject, schema: unknown): Generator<Record<string, unknown>>;
