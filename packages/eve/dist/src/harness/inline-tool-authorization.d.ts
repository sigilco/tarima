import type { AuthorizationSignal } from "#harness/authorization.js";
import type { ToolSignIn } from "#harness/call-executor.js";
import type { ApprovedCall } from "#harness/session-machine/view.js";
/** A call a sign-in stopped, the connections it needs, and the approval it ran on, if any. */
export interface StoppedCall {
    readonly call: ApprovedCall["call"];
    readonly connections: readonly string[];
    readonly approval?: Pick<ApprovedCall, "interactionId" | "responder">;
}
/** Resolves the sign-ins that stopped calls. */
export declare function resolveInlineAuthorizationInterrupt(input: {
    readonly signIns: readonly ToolSignIn[];
}): {
    readonly challenges: AuthorizationSignal["challenges"];
    /** The calls sign-ins stopped, each with the connections it needs. */
    readonly calls: readonly StoppedCall[];
} | undefined;
