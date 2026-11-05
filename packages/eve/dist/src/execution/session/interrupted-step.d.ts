import type { ContextContainer } from "#context/container.js";
import type { OrphanedLine } from "#execution/publish-session-events.js";
import type { DurableStepResult } from "#execution/session/turn-step-types.js";
import { type InterruptedCall } from "#harness/interrupted-attempt.js";
import type { Commit, ControlDelivery, HarnessSession, HarnessStepInput, SessionPublication } from "#harness/types.js";
import type { SessionOutcome } from "#protocol/session-events/families/session.js";
/** What an interrupted earlier attempt of a turn step published past the step's checkpoint. */
export interface InterruptedAttempt {
    /** The first line it wrote. */
    readonly since: number;
    readonly calls: ReadonlyMap<string, InterruptedCall>;
    /** The interactions it settled, such as approvals it applied. */
    readonly settledInteractions: ReadonlySet<string>;
    /** It ended the session. */
    readonly sessionEnded: SessionOutcome | undefined;
    /** It cleared the history. */
    readonly cleared: boolean;
    /** It settled a turn: the last one, with the reply's text. */
    readonly settledTurn?: {
        readonly failed: boolean;
        readonly text?: string;
    };
}
export declare function readInterruptedAttempt(since: number, lines: readonly OrphanedLine[]): InterruptedAttempt;
/**
 * Recovers a turn step whose earlier attempt published past the checkpoint. The orphaned lines
 * are already folded into the step's projection, so what the step writes follows them.
 *
 * What the attempt left open closes as superseded, and the step runs again from its checkpoint:
 * the calls the attempt started never run again, and the model reads which may have run. When
 * the attempt ended the session or settled its turn, nothing is left to run. The ending keeps
 * its outcome and recorded reply output; a settled turn keeps its input and reply in history.
 * A step that failed every attempt (`failed`) fails the turn with the error its last attempt
 * threw instead, and a turn interrupted too often fails too.
 *
 * Returns the step's result when it ends here, or the session the step runs on with. Its own
 * new facts use normal reactions; facts already recorded are only adopted.
 */
export declare function recoverInterruptedStep(input: {
    readonly attempt: InterruptedAttempt;
    readonly ctx: ContextContainer;
    readonly publish: (publication: SessionPublication, session: HarnessSession) => Promise<HarnessSession>;
    readonly session: HarnessSession;
    readonly stepInput: HarnessStepInput | undefined;
    /** Admission facts no attempt wrote, which a step that ends here must still write. */
    readonly admission: Commit;
    /** The control the step applies, with the delivery it arrived as. */
    readonly control?: {
        readonly kind: "clear" | "compact";
        readonly delivery?: ControlDelivery;
    };
    /** The error the step's last attempt threw, when every attempt failed. */
    readonly failed?: {
        readonly error: unknown;
    };
}): Promise<{
    readonly result: DurableStepResult;
} | {
    readonly session: HarnessSession;
    readonly stepInput: HarnessStepInput | undefined;
}>;
/** How many interrupted steps one turn runs again before it fails. */
export declare const MAX_TURN_INTERRUPTIONS = 3;
