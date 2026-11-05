import type { AuthorizationChallenge } from "#harness/authorization.js";
import type { SessionStateMap } from "#harness/types.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
import type { PendingResponder } from "./responders.js";
import { type Relay } from "./relays.js";
export interface HitlState {
    readonly signIns: readonly AuthorizationChallenge[];
    readonly responders: Readonly<Record<string, PendingResponder>>;
    readonly relays: ReadonlyMap<string, Relay>;
}
export declare function readHitlState(state: SessionStateMap | undefined): HitlState;
/** Unreadable checkpoint records must still prevent a handoff. */
export declare function holdsHitlRequests(state: SessionStateMap | undefined): boolean;
export interface HitlStateChange {
    readonly signIns?: readonly AuthorizationChallenge[];
    readonly relays?: Readonly<Record<string, Relay>>;
    readonly responders?: Readonly<Record<string, PendingResponder>>;
}
/** Changes and retirement share one save; the fold, not another ledger, owns record lifetime. */
export declare function writeHitlState<T extends {
    readonly state?: SessionStateMap;
}>(session: T, change: HitlStateChange, view?: SessionView): T;
