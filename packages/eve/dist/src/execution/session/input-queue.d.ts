import type { DeliverHookPayload, DeliverPayload, SessionAuthContext } from "#channel/types.js";
export type SessionControl = "clear" | "compact" | "expired" | "reset";
/** The delivery a control arrived as: its id, and who sent it. */
export interface ControlOrigin {
    readonly deliveryId: string;
    readonly auth?: SessionAuthContext | null;
}
export interface DeliveryAdmission {
    readonly delivery: DeliverHookPayload;
    readonly sequence: number;
}
export interface TurnSelection {
    readonly delivery: DeliverHookPayload;
    /**
     * True only for a lone, callerless conversational delivery that arrived
     * while nothing else was pending. Such a delivery may move the session to
     * the deployment that accepted it.
     */
    readonly handoffEligible: boolean;
    readonly kind: "turn";
    /** Sequences of every admission folded into this turn. */
    readonly sequences: readonly number[];
}
export type SessionInputSelection = TurnSelection | {
    readonly control: SessionControl;
    readonly kind: "control";
    readonly origin?: ControlOrigin;
};
/**
 * Ordered, admitted session input. Entries are private; callers receive typed
 * admission and selection values. Everything here is rebuilt deterministically
 * on replay.
 */
export declare class SessionInputQueue {
    private readonly entries;
    private readonly admittedKeys;
    private nextSequence;
    private prewarmDeploymentId;
    prepareOnDeployment(deploymentId: string): void;
    takePrewarmDeployment(): string | undefined;
    constructor(admittedDeliveryKeys: readonly string[]);
    get admittedDeliveryKeys(): readonly string[];
    isDuplicate(delivery: DeliverHookPayload): boolean;
    get pendingCount(): number;
    /** The sequence the next admission receives; every earlier admission is below it. */
    get nextAdmission(): number;
    enqueueDelivery(delivery: DeliverHookPayload): DeliveryAdmission | undefined;
    enqueueControl(control: SessionControl, origin?: ControlOrigin): void;
    /** Keeps one payload per authorization attempt; a repeated callback for the same attempt is dropped. */
    enqueueAuthorization(payloads: readonly DeliverPayload[]): void;
    /**
     * Removes and returns the queued callbacks for `attemptIds` once every one
     * has arrived, so a turn holding several sign-ins resumes when all are done.
     */
    takeAuthorizations(attemptIds: ReadonlySet<string>): DeliverPayload[] | undefined;
    delivery(sequence: number): DeliverHookPayload | undefined;
    replaceDelivery(sequence: number, delivery: DeliverHookPayload | undefined): void;
    takeSteering(admitted: ReadonlySet<number>, turn: SteeringTurn, options?: SteeringOptions): TurnSelection | undefined;
    /**
     * Takes the next turn or control. Sign-ins end with the turn that raised
     * them, so a callback still queued between turns is stale and dropped.
     */
    takeNext(options?: {
        /** Sequence of a delivery admitted while nothing else was pending. */
        readonly freshSequence?: number;
    }): SessionInputSelection | undefined;
    /**
     * Consecutive deliveries of one authenticated principal and one delegated
     * call share a turn, as they would steer it. Claims may change between
     * them; the turn runs with the latest.
     */
    private takeFollowingDeliveriesFrom;
    private retain;
}
/** The running turn a delivery may steer. */
export interface SteeringTurn {
    /** The call id of the delegated caller the turn answers, if any. */
    readonly callerCallId: string | undefined;
    readonly principal: string;
}
export interface SteeringOptions {
    /**
     * The turn waits on its own person for a sign-in or approval, held since
     * this admission sequence. Their later messages steer even with
     * `turnPolicy: "queue"`: queued, they would wait for a turn that cannot end
     * until they act. Earlier ones were sent before the request existed, so
     * they stay queued and never answer it.
     */
    readonly heldSince?: number;
}
/**
 * Only the turn's own principal steers it; another principal's message waits
 * for the turn to end. A delivery without auth acts as the session's current
 * identity, which is the turn's. `heldOnPerson` lets a queued message steer a
 * turn that waits on its person.
 */
export declare function isSteeringDelivery(delivery: DeliverHookPayload, turn: SteeringTurn, options?: {
    readonly heldOnPerson?: boolean;
}): boolean;
/** A steering delivery with a message for the model, not only answers to requests. */
export declare function isSteeringMessage(delivery: DeliverHookPayload, turn: SteeringTurn): boolean;
