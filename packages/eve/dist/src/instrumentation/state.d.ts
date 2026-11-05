import { type JsonValue } from "#shared/json.js";
export { preserveSerializedInstrumentationState } from "#shared/serialized-observability-state.js";
export interface InstrumentationStateOwner {
    readonly attemptId?: string;
    readonly sessionId?: string;
    readonly turnId?: string;
}
/** One provider's view of its own state for one operation. */
export interface InstrumentationStateSlot {
    get(): JsonValue | undefined;
    /** Stages a value; `undefined` releases the slot. */
    set(value: JsonValue | undefined): void;
}
interface InstrumentationStateLease extends InstrumentationStateSlot {
    /** Makes later reads empty and writes no-ops. */
    revoke(): void;
}
/**
 * Scopes state to one provider and one operation.
 *
 * Two providers handling the same event get separate slots, and the same
 * provider gets a separate slot per operation, so neither can read or clobber
 * the other's.
 */
export declare function instrumentationStateSlot(provider: string, idempotencyKey: string, owner?: InstrumentationStateOwner): InstrumentationStateLease;
/** Persists that a provider's start handler timed out for this operation. */
export declare function abandonInstrumentationState(provider: string, idempotencyKey: string, owner?: InstrumentationStateOwner): void;
export declare function isInstrumentationStateAbandoned(provider: string, idempotencyKey: string): boolean;
/** Releases one operation across namespaces, including providers no longer registered. */
export declare function releaseAllInstrumentationState(idempotencyKey: string): void;
/** Releases attempt-owned children across namespaces when their terminals are omitted. */
export declare function releaseAllInstrumentationAttemptState(attemptId: string): void;
export declare function releaseAllInstrumentationTurnState(sessionId: string, turnId?: string): void;
