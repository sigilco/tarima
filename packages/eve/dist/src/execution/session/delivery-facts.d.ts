import type { DeliverHookPayload, DeliverPayload, SessionAuthContext } from "#channel/types.js";
import type { HarnessStepInput, StepInput } from "#harness/types.js";
import type { AdmittedDelivery } from "#harness/session-machine/deliveries.js";
import type { Principal } from "#protocol/session-events/envelope.js";
import type { DeliveryRow } from "#protocol/session-projection/tables.js";
/**
 * What one step admits: the deliveries it records first, and each consumed payload's input,
 * carrying its delivery and each answer bound to the response it submits.
 */
export interface DeliveryAdmission {
    readonly deliveries: readonly AdmittedDelivery[];
    readonly inputs: readonly HarnessStepInput[];
}
export declare function planAdmission(input: {
    /** The delivery as the session accepted it. */
    readonly delivery: DeliverHookPayload;
    /** The payloads left once sign-in callbacks were matched out, with what `deliver` made of each. */
    readonly payloads: readonly {
        readonly payload: DeliverPayload;
        readonly input: StepInput | undefined;
    }[];
    /** The delivery's recorded status, including facts an interrupted attempt already wrote. */
    readonly status?: (deliveryId: string) => DeliveryRow["status"] | undefined;
    readonly channelKind: string;
}): DeliveryAdmission;
/** Who sent a delivery, as the wire names them. */
export declare function principalOf(auth: SessionAuthContext | null | undefined): Principal | undefined;
