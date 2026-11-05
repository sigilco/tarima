import type { ClearedBy } from "#protocol/session-events/families/call.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
declare const clearanceBrand: unique symbol;
/** What cleared one call to run: a policy, the person who approved it, or nothing it needed. */
export interface Clearance {
    readonly callId: string;
    readonly clearedBy?: ClearedBy;
    readonly [clearanceBrand]: true;
}
/** Only the gate calls this: the call may run, cleared by `clearedBy` when it needed clearing. */
export declare function mintClearance(callId: string, clearedBy?: ClearedBy): Clearance;
/**
 * The clearance a person's approval gives a call: the latest of its own approvals, accepted.
 * `undefined` when no one was asked, or the latest answer wasn't an acceptance.
 */
export declare function approvedClearance(view: SessionView, callId: string): Clearance | undefined;
/** Throws unless `clearance` clears the call about to run. */
export declare function requireClearance(clearance: Clearance, callId: string): void;
export {};
