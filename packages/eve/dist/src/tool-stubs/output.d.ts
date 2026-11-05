import type { JsonValue } from "#shared/json.js";
import type { ToolStubOutcome } from "#tool-stubs/types.js";
/** Throws at the tool boundary, after the outcome has been recorded for replay. */
export declare function toolStubOutput(outcome: ToolStubOutcome): JsonValue;
