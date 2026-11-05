import type { ControlSettlement } from "#harness/facts.js";
import type { ControlOrigin, SessionControl, SessionInputQueue, TurnSelection } from "#execution/session/input-queue.js";
import type { SessionInboxHandle, SessionInboxReader } from "#execution/session-inbox/inbox.js";
import type { SessionStateCursor } from "#execution/session/state-cursor.js";
import type { WorkflowToolRunMessage } from "#execution/tools/workflow/messages.js";
export type NextTurnInstruction = {
    readonly kind: "prewarm";
    readonly targetDeploymentId: string;
} | {
    readonly kind: "workflow";
    readonly message: WorkflowToolRunMessage;
} | {
    readonly kind: SessionControl;
    readonly origin?: ControlOrigin;
} | {
    readonly kind: "closed";
} | {
    readonly kind: "cancel-turn";
    readonly origin?: ControlOrigin;
}
/** `session.cancel()` while no turn runs, but tasks are working. */
 | {
    readonly kind: "cancel-working-tasks";
    readonly origin?: ControlOrigin;
} | TurnSelection;
/**
 * Waits for the next input the parked owner must act on. Fully routed
 * descendant deliveries leave nothing for the parent, so the wait continues.
 */
export declare function nextTurnDelivery(input: {
    readonly inbox: SessionInboxReader & Pick<SessionInboxHandle, "awaitingHandover" | "whenHandoverSettled">;
    readonly cursor: SessionStateCursor;
    readonly hasWorkingTasks: () => boolean;
    readonly queue: SessionInputQueue;
    /** Settles a control that changes nothing; a session that hasn't started defers it. */
    readonly ignore: (settlement: ControlSettlement) => Promise<void>;
}): Promise<NextTurnInstruction>;
