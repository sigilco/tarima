import type { Cause, ErrorInfo, JsonValue } from "#protocol/session-events/envelope.js";
import type { FactOf, Progress } from "#protocol/session-events/facts.js";
import type { Capability, CapabilityKind, CallOwner, ClearedBy } from "#protocol/session-events/families/call.js";
import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import type { RuntimeActionRequest, RuntimeActionResult } from "#shared/action-types.js";
/** What a call invokes: a tool, an agent, the skill it loads, or a task control, with its label. */
export declare function capabilityOf(action: RuntimeActionRequest, label?: string): Capability;
/** What a call to an entry invokes, as its input starts streaming. */
export declare function announcedKind(name: string, definition: Pick<HarnessToolDefinition, "behavior"> | undefined): CapabilityKind;
/** The model asked for a call. */
export declare function callRequested(input: {
    readonly action: RuntimeActionRequest;
    readonly owner: CallOwner;
    readonly label?: string;
    readonly inputError?: ErrorInfo;
}): FactOf<"call.requested">;
/** A call was cleared and began running. */
export declare function callStarted(callId: string, options?: {
    readonly clearedBy?: ClearedBy;
}): FactOf<"call.started">;
/** A call settled from its runtime result: failed if the result says so, otherwise completed. */
export declare function callSettledFrom(result: RuntimeActionResult, options?: {
    readonly label?: string;
    readonly rejected?: boolean;
    readonly cause?: Cause;
}): FactOf<"call.settled">;
/** A call's partial output, as progress. */
export declare function callProgress(callId: string, output: unknown, label?: string): Progress;
/** A value as the wire carries it: JSON, with anything else as its string form. */
export declare function toJsonValue(value: unknown): JsonValue;
