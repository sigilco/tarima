import type { SessionCapabilities, TurnCaller } from "#channel/types.js";
import type { SessionInputQueue } from "#execution/session/input-queue.js";
import type { SessionInboxReader } from "#execution/session-inbox/inbox.js";
import type { SessionStateCursor } from "#execution/session/state-cursor.js";
import { type WorkflowToolRunMessage } from "#execution/tools/workflow/messages.js";
import type { TurnOutcome, TurnStepPayload } from "#execution/session/turn-step-types.js";
import { ActiveTurn } from "#execution/session/active-turn.js";
import type { TurnControl } from "#execution/session/turn-control.js";
import type { RuntimeActionResult } from "#shared/action-types.js";
/** True when a delegating parent (local or remote) receives this session's input requests. */
export declare function hasDelegatedCallerContext(serializedContext: Record<string, unknown>): boolean;
export interface SessionExecutionInput {
    readonly capabilities?: SessionCapabilities;
    readonly cursor: SessionStateCursor;
    readonly inbox: SessionInboxReader;
    readonly queue: SessionInputQueue;
    readonly sessionId: string;
}
/**
 * Executes conversational turns inside the owning session workflow: runs
 * `turnStep`, services the inbox at committed boundaries, coordinates waits,
 * and settles locally. There is no child run and no transport protocol.
 */
export declare class SessionExecution {
    private readonly input;
    private observedHandoverAttemptKey;
    constructor(input: SessionExecutionInput);
    get cursor(): SessionStateCursor;
    runTurn(delivery: TurnStepPayload | undefined, options?: {
        /**
         * The delegated caller the turn answers, including for a first turn whose
         * input carries no caller. The turn's first step binds it into the context.
         */
        readonly caller?: TurnCaller;
        readonly control?: TurnControl;
    }): Promise<TurnOutcome>;
    /**
     * Applies what runs reported while the model step ran, so the next step sees
     * it. Consecutive messages the session applies as it reads them, such as a
     * fan-out's, share one step. An ending session drops its runs' agent session
     * messages: its stream is closed, and finalizing the session terminates the
     * children.
     */
    private handleBoundaryMessages;
    /** Hooks on the messages' events may cancel `turn`, the turn that is running. */
    private applyRunMessages;
    private runTurnSteps;
    /** The next step's input: what resumed the turn, behind any steering admitted meanwhile. */
    private withSteering;
    /**
     * Waits for what a paused turn awaits, and returns the input its next step reads:
     *
     * - an interaction's answer, a sign-in callback, or the turn's own requester steering it, for the
     *   requests and sign-ins it raised. Anyone else's message queues behind the turn, as does a
     *   message admitted before the step that raised the request (`heldSince`): it was sent
     *   before the request existed;
     * - one of its tasks settling. Steering interrupts that wait;
     * - every call's result. Steering interrupts the workflow tool calls, which still report.
     */
    private resume;
    /** Starts the runs a paused step asked for, answers its task tool calls, and tracks the rest. */
    private startCallWait;
    /**
     * Starts the workflow tool runs a parked step requested, and returns the
     * results of any that settled at once. Task tool calls need no dispatch: the
     * session answers them itself.
     */
    private dispatchRuns;
    /**
     * Handles a run message the session just read. One it applies as it reads
     * it takes along those read after it, from `turn` while a turn runs, so a
     * fan-out's messages share one step.
     */
    handleWorkflowMessage(message: WorkflowToolRunMessage, turn?: ActiveTurn): Promise<RuntimeActionResult | undefined>;
    /**
     * Stops the work a cancelled turn leaves behind: the workflow tool runs it
     * waits on and every working task. A turn that waits on no run, the common
     * case, skips that durable step.
     */
    cancelTurnWork(): Promise<void>;
    /** `session.cancel()` stops the turn, the calls it waits on, and every working task. */
    private finishCancelledTurn;
}
