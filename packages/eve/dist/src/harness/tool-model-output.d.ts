import type { JSONValue } from "ai";
import { type JsonValue } from "#shared/json.js";
import type { ToolModelOutputPart } from "#tools/definition.js";
/**
 * A validated {@link ToolModelOutput} in the AI SDK's expected shape:
 * `json` values are proven JSON-serializable, `content` arrays are
 * mutable, and file URLs are parsed `URL`s so the value is assignable to
 * the SDK's `ToolResultOutput`.
 */
export type ToolModelOutputValue = {
    readonly type: "json";
    readonly value: JSONValue;
} | {
    readonly type: "text";
    readonly value: string;
} | {
    readonly type: "error-text";
    readonly value: string;
} | {
    readonly type: "content";
    readonly value: ToolModelOutputValuePart[];
};
type ToolModelOutputValuePart = Extract<ToolModelOutputPart, {
    readonly type: "text";
}> | {
    readonly type: "file";
    readonly data: {
        readonly type: "data";
        readonly data: string;
    } | {
        readonly type: "url";
        readonly url: URL;
    };
    readonly mediaType: string;
    readonly filename?: string;
};
/**
 * Validates a tool output as JSON at one of the serialization boundaries,
 * normalizing top-level `undefined` to `null`. Throws
 * `ToolOutputSerializationError` on non-JSON-serializable values.
 */
export declare function normalizeToolJsonOutput(input: {
    readonly boundary: "execute" | "toModelOutput";
    readonly output: unknown;
    readonly toolCallId?: string;
    readonly toolName: string;
}): JsonValue;
/**
 * Single funnel for authored `toModelOutput` results. Validates the
 * eve-owned {@link ToolModelOutput} union and returns it in the AI SDK's
 * expected shape; every rejection throws `ToolOutputSerializationError`
 * at the `toModelOutput` boundary.
 */
export declare function normalizeToolModelOutput(input: {
    readonly output: unknown;
    readonly toolCallId?: string;
    readonly toolName: string;
}): ToolModelOutputValue;
export {};
