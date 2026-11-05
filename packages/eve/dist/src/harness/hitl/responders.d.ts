import type { SessionAuthContext } from "#channel/types.js";
import { type AuthorizationChallenge } from "#harness/authorization.js";
import type { Transition } from "#harness/session-machine/commit.js";
import { type SessionView } from "#harness/session-machine/view.js";
import type { HarnessStepInput, HarnessToolLookup } from "#harness/types.js";
/** Who answered an approval its tool's response policy hasn't allowed yet. */
export interface PendingResponder {
    readonly responder: SessionAuthContext;
    readonly expiresAt: number;
    /** The sign-ins the policy asked the responder for. */
    readonly challenges?: readonly AuthorizationChallenge[];
}
/** What checking a delivery's answers concluded, by response. */
export interface ResponderCheck {
    /** Answers that stand now. */
    readonly admit: readonly string[];
    /** Answers refused before any policy ran, with why. */
    readonly refused: readonly {
        readonly responseId?: string;
        readonly reason: string;
    }[];
    /** Answers a response policy weighs next step, with who gave each. */
    readonly weigh: Readonly<Record<string, PendingResponder>>;
}
/**
 * Checks who gave each of a delivery's answers. An approval takes only Approve or Cancel. Without
 * a response policy, it takes only its requester's answer, or anyone's when its requester is
 * anonymous; with one, it records an authenticated responder for the policy to weigh. Other
 * answers stand as they arrive, and an answer the session already holds was checked when it did.
 */
export declare function checkResponders(view: SessionView, delivery: HarnessStepInput | undefined, now: number): ResponderCheck;
/** What weighing the recorded answers concluded. */
export interface WeighedResponders extends Transition {
    /** Responders' sign-ins a policy asked for. */
    readonly challenges: readonly AuthorizationChallenge[];
    /** Approvals whose tool is gone: no answer can run their call. */
    readonly unavailable: readonly string[];
}
/**
 * Each recorded answer meets its response policy: allowed, it stands; refused or failed, it
 * settles with why; past its time, it expires. A policy that asks the responder to sign in waits
 * for the callback, then runs again.
 */
export declare function weighResponders(view: SessionView, input: {
    readonly now: number;
    /** The entries parked calls run with, which carry the policy. */
    readonly tools: () => Promise<HarnessToolLookup>;
}): Promise<WeighedResponders>;
/** Whether two auth contexts name the same principal. */
export declare function sameResponder(left: SessionAuthContext, right: SessionAuthContext): boolean;
