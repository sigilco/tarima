import { type DurableSessionState } from "#execution/durable-session-store.js";
import type { SessionStateTransition } from "#execution/session/state-delta.js";
interface SessionPrewarmInput {
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: DurableSessionState;
}
/**
 * Starts the session prewarmers for a session started without a message and
 * records what they prepared, such as the sandbox state, once their work
 * settles. Runs beside the wait for the first message and never fails.
 */
export declare function prewarmSessionStep(input: SessionPrewarmInput): Promise<SessionStateTransition>;
export {};
