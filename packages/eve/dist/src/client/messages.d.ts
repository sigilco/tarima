import type { Interaction } from "#protocol/session-projection/reader.js";
import type { EveMessage } from "#client/message-types.js";
import type { ImportedMessage } from "#protocol/session-events/families/delivery.js";
import type { DeliveryRow, SessionPreviews, SessionView } from "#protocol/session-projection/tables.js";
/** What a turn's message derives from: the tables, their previews, and the interactions shown. */
export interface MessageSources {
    readonly view: SessionView;
    readonly previews: SessionPreviews;
    readonly interactions: Readonly<Record<string, Interaction>>;
}
/** A message and the stream position it sorts at among its turn's messages. */
export interface PlacedMessage {
    readonly at: number;
    readonly message: EveMessage;
}
/**
 * The agent's messages for each of `turnIds` (every turn when absent): what its runs wrote and
 * called, and what it asked that no call carries, in the order the stream introduced them. A
 * message a person sent while the turn worked splits it, so what the agent did before it reads
 * above it and the rest below; each piece sorts at its first part, the last at the end. A turn
 * that has requested no run and shows nothing has no message.
 */
export declare function assistantMessages(sources: MessageSources, turnIds?: ReadonlySet<string>): ReadonlyMap<string, readonly PlacedMessage[]>;
/** What a person sent, as the turn that consumed it received it. An answer sends no message. */
export declare function userMessage(row: DeliveryRow): EveMessage | undefined;
/**
 * The earlier conversation a delivery imported, as messages. They name no turn, so a turn's reply
 * never streams into an imported assistant message.
 */
export declare function importedMessages(deliveryId: string, history: readonly ImportedMessage[]): readonly EveMessage[];
