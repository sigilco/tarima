import type { ControlOrigin } from "#execution/session/input-queue.js";
import type { DeliverHookPayload, TurnCaller } from "#channel/types.js";
import { type SteeringOptions } from "#execution/session/input-queue.js";
import type { SessionExecutionInput } from "#execution/session/turn.js";
import { type TurnControl } from "#execution/session/turn-control.js";
import { type WorkflowToolRunMessage } from "#execution/tools/workflow/messages.js";
import type { AppliedRunMessage } from "#execution/tools/workflow/apply-run-messages-step.js";
import type { RuntimeActionResult } from "#shared/action-types.js";
export type RuntimeEvent = {
    readonly kind: "runtime-action-result";
    readonly results: readonly RuntimeActionResult[];
} | {
    readonly kind: "workflow";
    readonly message: WorkflowToolRunMessage;
}
/** A steering message that answered no pending request arrived during the wait. */
 | {
    readonly kind: "steering";
}
/** An `eve__task_wait` call's timeout passed. */
 | {
    readonly kind: "timeout";
    readonly callId: string;
}
/** A delivery or sign-in callback was admitted; a paused turn's request may be answered. */
 | {
    readonly kind: "input";
} | "cancelled";
/**
 * Admission policy, cancellation, and steering for one active turn.
 * Deliveries admitted while a model step runs stay in the shared queue until
 * the turn reaches a committed boundary; a runtime-action wait routes them
 * eagerly so a proxied child can receive the answer it is blocked on.
 *
 * The pump signals cancellation and eligible steering immediately. Cancellation
 * aborts the turn; steering only interrupts generation before assistant output
 * or local tool execution. Both retain ordered admission at the next boundary.
 */
export declare class ActiveTurn {
    #private;
    private readonly admitted;
    private readonly routedToChildren;
    private readonly mappedForHeldRequest;
    private readonly runtimeResults;
    private readonly controller;
    private readonly expectedTurnId;
    private readonly input;
    /** Who alone steers the turn: its principal, or its delegated caller. */
    private readonly identity;
    private readonly unsubscribe;
    private unsubscribeDelivery;
    private steeringController;
    /** The delegated caller of the latest message the turn read. */
    caller: TurnCaller | undefined;
    /** A step of this turn compacted the history. */
    compacted: boolean;
    constructor(input: SessionExecutionInput, owner: {
        readonly caller: TurnCaller | undefined;
        /** A clear or a compact runs, not a turn: a cancel, which stops turns, leaves it to finish. */
        readonly control?: boolean;
        readonly principal: string;
    }, control?: TurnControl);
    private readonly signalSteering;
    get signal(): AbortSignal;
    dispose(): void;
    get steeringSignal(): AbortSignal;
    private resetSteering;
    /** Admits everything the pump accepted while the last step ran. */
    admitBoundary(settled?: boolean): Promise<void>;
    /**
     * Steering admitted during this turn, routed to children first and coalesced.
     * The next step reads it as input, so its signal must not interrupt that
     * step; only deliveries still unread re-signal the next generation.
     */
    takeSteering(options?: SteeringOptions): Promise<DeliverHookPayload | undefined>;
    /**
     * Removes the admitted run messages the session applies at once instead of
     * in a runtime wait, or only those `only` accepts.
     */
    takeBoundaryMessages(only?: (message: WorkflowToolRunMessage) => boolean): WorkflowToolRunMessage[];
    /**
     * Removes the run messages read after one the session just took, as long as
     * each is one it applies as it reads it and they fit one batch. Those it
     * already admitted come first, then those still in the inbox, so arrival
     * order holds.
     */
    takeAppliedRunMessages(): AppliedRunMessage[];
    /**
     * Next runtime result, workflow message, steering, or timeout, admitting
     * inbox traffic while waiting. Deliveries admitted before the wait began are
     * routed first, so a message that arrived as the calls started still steers.
     * `timers` are durable sleeps raced against the inbox.
     */
    nextRuntimeEvent(timers: readonly Promise<string>[]): Promise<RuntimeEvent>;
    /**
     * Takes one admitted delivery that answers a pending input request, from any
     * responder: an approver need not be the turn's own person. Returns
     * `undefined` when no admitted delivery answers one.
     */
    takeAnswers(requestIds: ReadonlySet<string>): Promise<DeliverHookPayload | undefined>;
    /** Resolves with the id of the call whose timer won, or `undefined` once inbox input is ready. */
    private waitForInboxOrTimer;
    private cancelsThisTurn;
    /** Admits one payload; returns whether it was a delivery or sign-in callback. */
    private admit;
    /**
     * During a runtime wait, descendant-bound answers cannot wait for the
     * boundary. Returns whether a newly routed delivery still steers: it
     * answered nothing, so its message is for the model.
     */
    private routeAdmittedToChildren;
    /** The cancel control that stopped this turn, when it named its delivery. */
    get cancelledBy(): ControlOrigin | undefined;
    /** Also used by hooks on workflow reports while the turn waits. */
    abort(): void;
}
