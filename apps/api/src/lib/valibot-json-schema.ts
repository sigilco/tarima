/**
 * Minimal valibot -> JSON Schema converter.
 *
 * The MCP endpoint publishes an `inputSchema` per tool. MCP clients
 * expect JSON Schema, but the contract speaks valibot, so the shapes
 * are derived here instead of being duplicated by hand (a hand written
 * copy would drift from the contract the moment the contract changes).
 *
 * Only the valibot features the contract actually uses are supported:
 * objects, arrays, records, strings, numbers, booleans, unions,
 * intersections, optionals, nullables, picklists, enums, literals and
 * the common string/number validations. Anything unknown degrades to
 * `{}` (any value) rather than throwing, so a future contract change
 * cannot break the tools/list response.
 *
 * No new dependency: the converter reads the valibot schema objects
 * directly.
 */

/** A JSON Schema fragment. */
export type JsonSchema = Record<string, unknown>;

interface ValibotSchema {
  kind?: string;
  type?: string;
  entries?: Record<string, ValibotSchema>;
  item?: ValibotSchema;
  key?: ValibotSchema;
  value?: ValibotSchema;
  wrapped?: ValibotSchema;
  options?: ValibotSchema[];
  pipe?: ValibotSchema[];
  literal?: unknown;
  enum?: unknown[];
  requirement?: unknown;
  items?: ValibotSchema[];
}

/** Convert a valibot schema into a JSON Schema fragment. */
export function toJsonSchema(schema: unknown): JsonSchema {
  if (!schema || typeof schema !== "object") return {};
  return convert(schema as ValibotSchema);
}

function convert(schema: ValibotSchema): JsonSchema {
  // A piped schema carries its base type in `pipe[0]` and the
  // validations after it.
  if (Array.isArray(schema.pipe) && schema.pipe.length > 0) {
    const base = convert(schema.pipe[0] as ValibotSchema);
    const out: JsonSchema = { ...base };
    for (const rule of schema.pipe.slice(1)) out.type = out.type ?? rule.type;
    for (const rule of schema.pipe.slice(1)) applyRule(out, rule);
    return out;
  }

  switch (schema.type) {
    case "object": {
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      for (const [key, entry] of Object.entries(schema.entries ?? {})) {
        properties[key] = convert(entry);
        if (!isOptional(entry)) required.push(key);
      }
      const out: JsonSchema = { type: "object", properties };
      if (required.length > 0) out.required = required;
      out.additionalProperties = false;
      return out;
    }
    case "array":
      return { type: "array", items: convert(schema.item as ValibotSchema) };
    case "tuple":
      return {
        type: "array",
        items: (schema.items ?? []).map((item) => convert(item)),
        minItems: (schema.items ?? []).length,
        maxItems: (schema.items ?? []).length,
      };
    case "record":
      return {
        type: "object",
        additionalProperties: convert(schema.value as ValibotSchema),
      };
    case "string":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "literal":
      return { const: schema.literal };
    case "picklist":
      return { type: "string", enum: [...(schema.options ?? [])] };
    case "enum":
      return { enum: [...(schema.enum ?? [])] };
    case "union": {
      const options = (schema.options ?? []).map((option) => convert(option));
      return options.length === 1 ? options[0] : { anyOf: options };
    }
    case "intersect": {
      const options = (schema.options ?? []).map((option) => convert(option));
      const properties: Record<string, JsonSchema> = {};
      const required = new Set<string>();
      let additionalProperties: unknown = undefined;
      for (const option of options) {
        const props = option.properties as Record<string, JsonSchema> | undefined;
        if (props) Object.assign(properties, props);
        for (const key of (option.required as string[] | undefined) ?? []) required.add(key);
        if (option.additionalProperties !== undefined) {
          additionalProperties = option.additionalProperties;
        }
      }
      const out: JsonSchema = { type: "object", properties };
      if (required.size > 0) out.required = [...required];
      out.additionalProperties = additionalProperties ?? false;
      return out;
    }
    case "optional":
    case "nullish": {
      const wrapped = convert(schema.wrapped as ValibotSchema);
      if (schema.type === "nullish") return { ...wrapped, nullable: true };
      return wrapped;
    }
    case "nullable": {
      const wrapped = convert(schema.wrapped as ValibotSchema);
      return { ...wrapped, nullable: true };
    }
    case "unknown":
    case "any":
      return {};
    case "never":
      return { not: {} };
    default:
      return {};
  }
}

/** True when the schema accepts `undefined` (so the key is not required). */
function isOptional(schema: ValibotSchema): boolean {
  if (schema.type === "optional" || schema.type === "nullish") return true;
  if (Array.isArray(schema.pipe)) {
    return schema.pipe.some((rule) => rule.type === "optional" || rule.type === "nullish");
  }
  return false;
}

/** Apply a valibot validation rule to a JSON Schema fragment. */
function applyRule(out: JsonSchema, rule: ValibotSchema): void {
  switch (rule.type) {
    case "min_length":
      out.minLength = rule.requirement;
      break;
    case "max_length":
      out.maxLength = rule.requirement;
      break;
    case "length":
      out.minLength = rule.requirement;
      out.maxLength = rule.requirement;
      break;
    case "not_empty":
      out.minLength = 1;
      break;
    case "uuid":
      out.format = "uuid";
      break;
    case "email":
      out.format = "email";
      break;
    case "iso_timestamp":
      out.format = "date-time";
      break;
    case "iso_date":
      out.format = "date";
      break;
    case "iso_time":
      out.format = "time";
      break;
    case "url":
      out.format = "uri";
      break;
    case "regex":
      out.pattern = rule.requirement;
      break;
    case "starts_with":
      out.pattern = `^${escapeRegex(String(rule.requirement))}`;
      break;
    case "ends_with":
      out.pattern = `${escapeRegex(String(rule.requirement))}$`;
      break;
    case "includes":
      out.pattern = escapeRegex(String(rule.requirement));
      break;
    case "value":
      out.const = rule.requirement;
      break;
    case "integer":
      out.type = "integer";
      break;
    case "min_value":
      out.minimum = rule.requirement;
      break;
    case "max_value":
      out.maximum = rule.requirement;
      break;
    case "to_min_value":
      out.minimum = rule.requirement;
      break;
    case "to_max_value":
      out.maximum = rule.requirement;
      break;
    case "multiple_of":
      out.multipleOf = rule.requirement;
      break;
    default:
      // Unknown rules (brands, transforms, refinements) carry no JSON
      // Schema equivalent; the base type already constrains the value.
      break;
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
