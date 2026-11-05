import type { ApprovalMemory, RememberRequest } from "#approval/evaluation.js";
import type { SessionAuthContext } from "#channel/types.js";
import { type Clearance } from "#harness/clearance.js";
import type { SessionView } from "#harness/session-machine/view.js";
import { type ModelMessage, type TelemetryOptions, type ToolResultPart, type ToolSet, type TypedToolCall, type TypedToolResult } from "ai";
import { type AuthorizationSignal } from "#harness/authorization.js";
import { type RunnableTool } from "#harness/tools.js";
import type { HandleEventFn, HarnessToolLookup } from "#harness/types.js";
import type { ApprovalAsk } from "#harness/session-machine/view.js";
type ToolResponsePart = Extract<ModelMessage, {
    role: "tool";
}>["content"][number];
/** A call's result, as the model reads it. */
export interface CallResult {
    readonly part: Extract<ToolResponsePart, {
        type: "tool-result";
    }>;
}
/** What the model reads for an approved call the turn's cancellation cut short. */
export declare const APPROVED_CALL_INTERRUPTED_MESSAGE = "The turn was cancelled while this approved tool call was running. It may have partially run; it was not retried.";
/** How a call's approval is decided before it runs. */
type CallApproval = 
/** A person approved it; the policy may still refuse it now. */
"recheck"
/** The model just made it; the policy decides whether it runs, waits for a person, or is denied. */
 | "evaluate";
/** A call that stopped for a sign-in: the tool returned the challenge instead of a result. */
export interface ToolSignIn {
    readonly callId: string;
    readonly input: unknown;
    readonly toolName: string;
    readonly signal: AuthorizationSignal;
    readonly version?: string;
}
/** How one call came out: its result for the model, or what it waits on instead. */
export interface CallOutcome {
    readonly remember?: RememberRequest;
    /** What cleared a call the runtime runs outside the step, such as a workflow tool's. */
    readonly clearance?: Clearance;
    readonly settled: readonly CallResult[];
    /** What `execute` returned, for `endsTurn`. */
    readonly toolResults: readonly TypedToolResult<ToolSet>[];
    readonly awaitsApproval?: true;
    readonly signIn?: ToolSignIn;
}
/**
 * Runs one local call: it decides the approval, streams the call's progress and result, and
 * returns the result the model reads. A call a person approved revalidates its input first.
 */
export declare function executeToolCall(call: {
    readonly callId: string;
    readonly input: unknown;
    readonly toolName: string;
}, input: {
    readonly abortSignal: AbortSignal | undefined;
    readonly approvalMemory?: ApprovalMemory;
    readonly definition: RunnableTool;
    readonly messages: readonly ModelMessage[];
    readonly publish: HandleEventFn;
    readonly telemetry?: TelemetryOptions;
    /** The AI SDK's ID for the model call that made a fresh call. */
    readonly modelCallId?: string;
    /** Runs just before the tool does, as the step's steering protection. */
    readonly beforeExecute?: () => void;
    /** The session as the call resumes, where a person's acceptance clears a call they approved. */
    readonly view?: () => Pick<SessionView, "projection">;
    /** Who approved the call, which it reads as `ctx.approval`; it still runs as the requester. */
    readonly responder?: SessionAuthContext;
    /**
     * Runs once the call settles, just before its result is reported: with why it didn't succeed,
     * if it didn't. Not when it stops for a sign-in or the turn's cancellation cuts it short.
     */
    readonly beforeResult?: (failure?: Error | string) => Promise<void>;
}, approval: CallApproval): Promise<CallOutcome>;
/** What the local calls of one model response produced. */
export interface InlineCallResults {
    /** The calls' results, for the response's tool message. */
    readonly parts: readonly ToolResultPart[];
    /** What each call's `execute` returned, for `endsTurn`. */
    readonly toolResults: readonly TypedToolResult<ToolSet>[];
    /** The calls that wait on a person's approval. */
    readonly approvals: readonly ApprovalAsk[];
    /** The calls that stopped for a sign-in. */
    readonly signIns: readonly ToolSignIn[];
    readonly policyApprovals?: Readonly<Record<string, Clearance>>;
}
/** Nothing ran: the response ended early, or made no local calls. */
export declare const NO_INLINE_CALLS: InlineCallResults;
/**
 * Runs the local calls a model response made. The AI SDK only calls the model: eve decides each
 * call's approval and runs it the way it runs a call a person approved. A call to a tool that runs
 * outside the step (a workflow or task tool) is decided here and left for the runtime.
 */
export declare function executeInlineCalls(input: {
    readonly toolCalls: readonly TypedToolCall<ToolSet>[];
    /** Calls whose input failed validation; they already have their result. */
    readonly excludedCallIds: ReadonlySet<string>;
    /** The step's entries: each call already names the entry it runs. */
    readonly tools: HarnessToolLookup;
    readonly approvalMemory: ApprovalMemory;
    /** The conversation the tools read as `ctx.messages`. */
    readonly messages: readonly ModelMessage[];
    readonly publish: HandleEventFn;
    readonly abortSignal: AbortSignal | undefined;
    readonly telemetry?: TelemetryOptions;
    /** The AI SDK's ID for the model call that made the calls. */
    readonly modelCallId?: string;
    /** Runs just before each tool does, so steering no longer interrupts the step. */
    readonly beforeExecute: () => void;
}): Promise<InlineCallResults>;
/** Reports a call its approval policy refused: it settles rejected, without running. */
export declare function publishDenial(call: {
    readonly callId: string;
    readonly input: unknown;
    readonly toolName: string;
}, input: {
    readonly publish: HandleEventFn;
    readonly reason: string | undefined;
}): Promise<CallOutcome>;
export {};
