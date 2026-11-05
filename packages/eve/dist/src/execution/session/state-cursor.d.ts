import type { DurableSessionState } from "#execution/durable-session-store.js";
import type { SessionHistoryStepState, SessionStepState } from "#execution/publish-session-events.js";
import { type SessionStateTransition, type SessionStateValues } from "#execution/session/state-delta.js";
import type { SessionInboxOwnership } from "#execution/session-inbox/inbox.js";
import type { HarnessModelMessage } from "#harness/messages.js";
/**
 * The one set of session values owned by the workflow executing a session.
 * Steps run against it and return deltas; the cursor applies each to the
 * values its step was given and claims any continuation address the step
 * introduced, so every hook the session answers to is registered before the
 * next step runs.
 */
export declare class SessionStateCursor {
    readonly sessionWritable: WritableStream<Uint8Array>;
    private readonly inbox;
    private values;
    /** Session steps adopted so far, and those still running. */
    private adopted;
    private running;
    constructor(input: SessionStateValues & {
        readonly inbox: Pick<SessionInboxOwnership, "claimSessionHooks">;
        readonly sessionWritable: WritableStream<Uint8Array>;
    });
    get serializedContext(): Record<string, unknown>;
    get sessionState(): DurableSessionState;
    get history(): HarnessModelMessage[];
    /**
     * Runs a session-changing step against the current context and session
     * state and adopts the delta it returns. The step is not given the history,
     * which is the bulk of a long session, so its Workflow step input stays
     * small; it cannot change the history either.
     */
    advance<T extends SessionStateTransition>(step: (state: SessionStepState) => Promise<T>): Promise<T>;
    /** {@link advance} for a step that reads or changes the history, such as a turn. */
    advanceWithHistory<T extends SessionStateTransition>(step: (state: SessionHistoryStepState) => Promise<T>): Promise<T>;
    /**
     * Runs a step beside the session's own steps, which do not wait for it.
     * Its delta applies only while `wanted()` holds, no other step ran or is
     * running meanwhile, and it adds no session address; otherwise it is
     * dropped and this returns `false`. A step run this way must leave nothing
     * that dropping its delta would lose for good.
     */
    advanceBeside<T extends SessionStateTransition>(step: (state: SessionStepState) => Promise<T>, wanted: () => boolean): Promise<boolean>;
    /**
     * A delta describes a change to exactly the values its step was given, so
     * values that another step changed in the meantime are a sequencing bug,
     * never a merge.
     */
    private adopt;
}
