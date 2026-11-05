import type { ApprovalMemory } from "#approval/evaluation.js";
import type { ModelMessage, TelemetryOptions } from "ai";
import type { SessionAuthContext } from "#channel/types.js";
import { type CallResult, type ToolSignIn } from "#harness/call-executor.js";
import type { HandleEventFn, HarnessToolLookup } from "#harness/types.js";
import type { ApprovedCall } from "#harness/session-machine/state.js";
import type { SessionView } from "#harness/session-machine/view.js";
export { APPROVED_CALL_INTERRUPTED_MESSAGE } from "#harness/call-executor.js";
/**
 * Runs approved local calls before the model reads their results. Like the calls a model step
 * runs inline, each streams its progress and result as it goes. The lifecycle owner places the
 * results in the steps that made the calls.
 */
export declare function runApprovedCalls(input: {
    readonly approvals: readonly ApprovedCall[];
    /** The entries of the step that asked, which the approved calls run. */
    readonly tools: HarnessToolLookup;
    readonly approvalMemory?: ApprovalMemory;
    /** The conversation the tools read as `ctx.messages`. */
    readonly messages: readonly ModelMessage[];
    readonly publish: HandleEventFn;
    readonly abortSignal: AbortSignal | undefined;
    /** The step attempt's telemetry, which hears each execution as the AI SDK reports it. */
    readonly telemetry?: TelemetryOptions;
    /** Who approved each call, which it reads as `ctx.approval`; it still runs as the requester. */
    readonly responderOf?: (approval: ApprovedCall) => SessionAuthContext | undefined;
    /** The session as of the latest publish, which says whether a call's sign-ins are still open. */
    readonly view: () => Pick<SessionView, "projection">;
}): Promise<{
    readonly settled: readonly CallResult[];
    readonly signIns: readonly ToolSignIn[];
}>;
