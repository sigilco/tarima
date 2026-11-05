import type { LocalSubmission } from "#client/conversation.js";
import type { SendTurnPayload } from "#client/types.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
/** Local message echoes until their deliveries arrive, including failed sends. */
export declare class OptimisticMessageSubmissions {
    #private;
    constructor(show: (submissions: readonly LocalSubmission[]) => void, optimistic: boolean);
    reset(): void;
    submit(input: SendTurnPayload, turnId?: string): string | undefined;
    resubmit(id: string | undefined, input: SendTurnPayload): string | undefined;
    correlate(id: string | undefined, deliveryId: string): void;
    reconcile(view: SessionView): void;
    fail(error: Error, id: string | undefined): void;
    get awaitingReceipt(): boolean;
}
