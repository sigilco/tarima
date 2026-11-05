/**
 * Serializes model and tool payloads into span content attributes for the
 * local trace viewer: prompt messages, the system prompt, responses, and
 * tool arguments/results. Everything is capped so a giant payload cannot
 * bloat a span segment past the reader's per-file limit, and message
 * payloads stay valid JSON through every truncation path.
 */
/** Content attributes are capped so a giant payload cannot bloat a span segment. */
export declare const CONTENT_ATTRIBUTE_LIMIT: number;
import type { ContentSerializer, InputMessagesContent } from "../core/types.js";
export declare const aiSdkContentSerializer: ContentSerializer;
export declare function telemetryByteLength(text: string): number;
export declare function truncateTelemetryText(text: string, maxBytes: number): string;
export declare function boundedPrincipalId(value: unknown): string | undefined;
export declare function boundedTraceError(value: Error): Error;
/** Serializes one payload value as capped JSON. */
export declare function contentAttribute(value: unknown): string | undefined;
/** Serializes model messages using the OpenTelemetry GenAI message schema. */
export declare function genAiInputMessagesAttribute(messages: unknown, messageKind?: (value: unknown) => string | undefined): InputMessagesContent | undefined;
/** Serializes the system prompt using the OpenTelemetry GenAI instruction schema. */
export declare function genAiSystemInstructionsAttribute(instructions: unknown): string | undefined;
/** Serializes one model response using the OpenTelemetry GenAI message schema. */
export declare function genAiOutputMessagesAttribute(content: readonly unknown[], finishReason: string): string | undefined;
/** Serializes memory records using the OpenTelemetry GenAI memory-records schema. */
export declare function genAiMemoryRecordsAttribute(records: readonly unknown[]): string | undefined;
/**
 * Serializes provider-executed tool results, keeping the attribute valid
 * JSON under the cap: when the full payload is too big, each entry's input
 * and output collapse to capped text at progressively smaller budgets
 * instead of cutting the JSON mid-string.
 */
export declare function toolResultsContentAttribute(results: readonly Record<string, unknown>[]): string | undefined;
/** Serializes tool definitions, dropping trailing entries to keep the JSON whole. */
export declare function genAiToolDefinitionsAttribute(tools: unknown): string | undefined;
/** Caps plain text, marking the cut. */
export declare function textContentAttribute(text: string): string | undefined;
