import { callRequested, callSettledFrom } from "#harness/call-facts.js";
import type { Commit } from "#harness/types.js";
import type { Clearance } from "#harness/clearance.js";
type Requested = Parameters<typeof callRequested>[0];
type Settled = Parameters<typeof callSettledFrom>;
/** Calls asked for together, as one commit. */
export declare function requestCalls(calls: readonly Requested[]): Commit;
/** A call the model asked for. */
export declare function requestCall(call: Requested): Commit;
/** A call a provider runs as it streams: requested and started together, cleared by the provider. */
export declare function requestProviderCalls(calls: readonly Requested[]): Commit;
/** A call the gate cleared begins running, recording what cleared it, if anything had to. */
export declare function startCall(clearance: Clearance): Commit;
/** A call settled from its runtime result. */
export declare function settleCall(...settled: Settled): Commit;
export {};
