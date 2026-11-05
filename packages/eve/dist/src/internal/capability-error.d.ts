import type { JsonObject } from "#shared/json.js";
/** Keeps transport diagnostics without persisting known capability values or URL encodings. */
export declare function formatCapabilityError(error: unknown, capabilities: readonly (string | undefined)[]): JsonObject;
