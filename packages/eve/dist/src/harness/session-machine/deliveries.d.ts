import { sessionEndedFacts, type ControlSettlement } from "#harness/facts.js";
import type { Commit, ControlDelivery } from "#harness/types.js";
import type { SessionProjection } from "#protocol/session-projection.js";
import type { DeliveryAdmittedData } from "#protocol/session-events/families/delivery.js";
import type { SessionStartedData } from "#protocol/session-events/families/session.js";
/** A delivery as a step admits it: recorded unless an earlier attempt did, ignored or consumed. */
export interface AdmittedDelivery extends DeliveryAdmittedData {
    /** An interrupted attempt already recorded its admission. */
    readonly recorded?: boolean;
    /** Nothing consumes it: it settles `ignored`, with why when given. */
    readonly ignored?: {
        readonly reason?: string;
    };
}
/**
 * One step's admission: the session's start, when it hasn't, then each delivery admitted, and each
 * ignored one settled.
 */
export declare function admitDeliveries(deliveries: readonly AdmittedDelivery[], options?: {
    readonly start?: SessionStartedData;
}): Commit;
/** A control is admitted, and applied at once when `applied`: nothing waits on it. */
export declare function admitControl(delivery: ControlDelivery, control: string, options?: {
    readonly applied?: true;
}): Commit;
/** A control's admission and settlement, together. */
export declare function settleControl(settlement: ControlSettlement): Commit;
/**
 * A control an interrupted step left unsettled fails rather than run again; an attempt that
 * recorded its admission doesn't record it twice.
 */
export declare function failInterruptedControl(delivery: ControlDelivery, control: string, options: {
    readonly recorded: boolean;
}): Commit;
/** A delivery the step admitted settles: applied, or failed with why. */
export declare function settleDelivery(deliveryId: string, outcome: "applied" | "failed", reason?: string): Commit;
/**
 * The session ends. It needs only what the stream recorded, since a session ends exactly when its
 * agent may not load: the writer closes what it leaves open.
 */
export declare function endSession(projection: Pick<SessionProjection, "view"> | undefined, ending: Parameters<typeof sessionEndedFacts>[1]): Commit;
