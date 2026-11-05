import type { HarnessSession, SessionStateMap } from "#harness/types.js";
interface TurnClientContextState {
    /** Position of ephemeral client context in each model request for this turn. */
    readonly insertionIndex: number;
    readonly messages: readonly string[];
    readonly turnId: string;
}
export declare function getTurnClientContextState(state: SessionStateMap | undefined, turnId: string): TurnClientContextState | undefined;
export declare function setTurnClientContextState(session: HarnessSession, clientContext: TurnClientContextState): HarnessSession;
export declare function clearTurnClientContextState(session: HarnessSession): HarnessSession;
export {};
