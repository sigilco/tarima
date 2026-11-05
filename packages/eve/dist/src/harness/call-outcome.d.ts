import type { ErrorInfo } from "#protocol/session-events/envelope.js";
import type { RuntimeActionResult } from "#shared/action-types.js";
export declare function callOutcomeOf(result: RuntimeActionResult): {
    readonly outcome: "completed" | "failed";
    readonly error?: ErrorInfo;
};
