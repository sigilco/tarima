import type { ModelMessage } from "ai";
import { type SessionProjection } from "#protocol/session-projection.js";
import type { DurableSession, DurableSessionState } from "#execution/durable-session-store.js";
import type { HarnessModelMessage } from "#harness/messages.js";
export type LegacySession = DurableSession & {
    readonly history: ModelMessage[];
};
/** Reads the driver's embedded snapshot; every supported driver carries one. */
export declare function readLegacySnapshot(state: Record<string, unknown> & {
    sessionId: string;
}): LegacySession;
/** Keep committed conversation data, but no pre-cutover execution registries. */
export declare function importConversation(session: LegacySession): {
    readonly history: HarnessModelMessage[];
    readonly sessionState: DurableSessionState;
};
/**
 * The turn position a legacy driver persisted, as the projection that replaces it, with what it
 * counted the session spent as the view's usage, so the session's limits keep counting.
 */
export declare function importProjection(session: LegacySession): SessionProjection;
