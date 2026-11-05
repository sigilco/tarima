import type { Tool } from "ai";
import type { JsonObject } from "#shared/json.js";
/**
 * What the model reads when it gives its final output beside calls whose results it hasn't seen:
 * the turn can't end on an answer written before them, so it answers again once they arrive.
 */
export declare const FINAL_OUTPUT_BESIDE_PENDING_CALLS = "Your reply wasn't delivered because other calls in this response were still running. Use their results, then call eve__reply again.";
/**
 * Builds the model-facing `eve__reply` tool from a lowered output schema.
 *
 * The tool has no `execute`: calling it is the terminal signal the harness
 * intercepts to surface the structured result. Its input is provider-constrained
 * to the schema during generation, exactly like every other eve tool input.
 */
export declare function buildFinalOutputTool(schema: JsonObject): Tool;
