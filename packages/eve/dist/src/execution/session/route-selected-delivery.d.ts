import type { TurnSelection } from "#execution/session/input-queue.js";
import type { SessionStateCursor } from "#execution/session/state-cursor.js";
type RoutedTurnSelection = {
    readonly kind: "cancel-turn";
} | {
    readonly kind: "consumed";
} | TurnSelection;
/** Routes one selected delivery exactly once, independent of active/parked mode. */
export declare function routeSelectedDelivery(selection: TurnSelection, cursor: SessionStateCursor): Promise<RoutedTurnSelection>;
export {};
