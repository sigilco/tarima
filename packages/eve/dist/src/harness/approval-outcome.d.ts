import type { SettledCall } from "#harness/session-machine/transitions.js";
import type { ResponseValue } from "#protocol/session-events/families/response.js";
export declare const TOOL_EXECUTION_DENIED_MESSAGE = "Tool execution was denied.";
type ApprovalTerminalStatus = "approved" | "denied" | "ignored" | "invalid";
export declare function resolveApprovalOutcome(response: ResponseValue | undefined): {
    readonly approved: boolean;
    readonly reason: string | undefined;
    readonly status: ApprovalTerminalStatus;
};
/**
 * What the model reads when a call's tool went away before the call could run.
 * `searchable` says whether the agent has `eve__search` to find another.
 */
export declare function unavailableToolMessage(toolName: string, searchable: boolean): string;
/** Whether a parked call's dynamic entry has changed since the model was offered it. */
export declare function changedSinceOffered(call: {
    readonly version?: string;
}, definition: {
    readonly version?: string;
} | undefined): boolean;
/** What the model reads when a call's dynamic entry changed before the call could run. */
export declare function changedToolMessage(toolName: string): string;
/**
 * A call that ends without running: its failed runtime result, which the lifecycle reports at the
 * step's coordinates, and the `error-text` result the model reads.
 */
export declare function failedCall(call: {
    readonly callId: string;
    readonly message: string | Error;
    readonly toolName: string;
}): Required<Pick<SettledCall, "part" | "result">>;
export {};
