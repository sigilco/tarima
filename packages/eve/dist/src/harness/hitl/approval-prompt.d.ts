import type { ApprovalAsk, SuspendedStep } from "#harness/session-machine/state.js";
import type { SessionView } from "#harness/session-machine/view.js";
/** True when text is eve's notice of pending approvals, not something a person wrote. */
export declare function isPendingApprovalsNotice(text: string): boolean;
/** Renders trusted runtime guidance for currently pending approvals. */
export declare function renderPendingApprovalsInstruction(requests: readonly ApprovalAsk[]): string | undefined;
/** The step's approvals nobody has settled: open, or not asked yet. */
export declare function pendingApprovals(view: SessionView, step: SuspendedStep): readonly ApprovalAsk[];
/** eve's note on the calls still awaiting approval, from the session's current approvals. */
export declare function pendingApprovalsNote(view: SessionView): string | undefined;
