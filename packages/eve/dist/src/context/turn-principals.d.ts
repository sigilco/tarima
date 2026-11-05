import type { SessionAuthContext } from "#channel/types.js";
/**
 * The active turn's caller and, when it differs, its initiator, read the same
 * way for every consumer that attributes work to a person. `undefined` when
 * the turn has no authenticated caller. Anonymous principals read as absent:
 * every anonymous caller shares one synthetic identity, so one cannot be told
 * apart from another, or vouched for.
 */
export declare function readTurnPrincipals(): {
    readonly current: SessionAuthContext;
    readonly initiator?: SessionAuthContext;
} | undefined;
