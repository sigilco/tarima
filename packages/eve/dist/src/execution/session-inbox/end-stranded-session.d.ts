import type { SessionControlIdentity } from "#channel/types.js";
import { type SessionInboxAddress } from "#execution/session-inbox/address.js";
import { type StrandedSessionOwnerError } from "#execution/session-inbox/owner.js";
/** What made eve end a stranded session; recorded for operators. */
export type StrandedSessionEndTrigger = "message" | "reset" | "timeout";
/**
 * The `session.ended` cause naming what ended a stranded session without a control delivery:
 * `stranded-message` or `stranded-timeout`. A reset's cause names its control delivery instead.
 */
export declare function strandedEndPolicy(trigger: StrandedSessionEndTrigger): string;
/**
 * Ends a stranded session without running any of its code, so none of its
 * terminal hooks fire: cancels its owner run and the original run that
 * anchors its stream, then waits until the World has released every address
 * the owner answered to so a fresh session can claim them. Ending cannot be
 * undone, so each one is logged for operators. Returns the ended session's id.
 * Does not discover or cancel descendants: their handles live in the
 * session's state, which only its own code reads. The replay guard retires
 * incompatible subagent and workflow tool runs when their deliveries arrive;
 * timers remain runnable.
 *
 * Every step tolerates a previous or concurrent attempt having done it
 * already, so a request that fails part way can simply be retried. Concurrent
 * attempts are not arbitrated: each may publish and cancel independently.
 */
export declare function endStrandedSession(stranded: StrandedSessionOwnerError, 
/** The address the caller used; a session address names the session outright. */
address: string | SessionInboxAddress, trigger: StrandedSessionEndTrigger, control?: SessionControlIdentity): Promise<string>;
