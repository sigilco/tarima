import type { PreparedLegacySession } from "./prepare-step.js";
/** Only the elected importer may stop work or append cancellation events. */
export declare function interruptLegacySessionStep(prepared: PreparedLegacySession): Promise<import("#execution/settle-cancelled-turn-step.js").CancelledTurnSettleResult>;
