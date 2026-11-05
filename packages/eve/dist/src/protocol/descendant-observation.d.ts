/** Fixed safety bounds for optional descendant observation, independent of execution budgets. */
export declare const DESCENDANT_MAX_DEPTH = 8;
export declare const DESCENDANT_MAX_SESSIONS = 128;
export declare const DESCENDANT_MAX_READS = 8;
/** Coordinates are data; the owning server verifies the opening at this committed source line. */
export interface DescendantHop {
    readonly sessionId: string;
    readonly position: number;
}
/** Server-established reader namespace and session identity; never contains credentials. */
export declare const EVE_OBSERVATION_KEY_HEADER = "x-eve-observation-key";
export declare function localObservationKey(sessionId: string): string;
