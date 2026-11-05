/**
 * One prior message passed as `history` to `send()` or `create()`.
 *
 * Entries become real user and assistant turns in the session's model history
 * and are recorded on the `delivery.consumed` of the message that brings them.
 */
export interface SessionHistoryMessage {
    /** Optional app-owned id, echoed in `delivery.consumed` history so clients can join annotations. */
    readonly id?: string;
    readonly role: "user" | "assistant";
    /** Plain text. Channels render speaker attribution into this text when needed. */
    readonly text: string;
}
/** Thrown when `history` passed to a send does not satisfy the seeding contract. */
export declare class InvalidSessionHistoryError extends Error {
    readonly name = "InvalidSessionHistoryError";
}
/**
 * Validates `history` at the send boundary and returns a normalized copy.
 * Returns `undefined` when `history` is omitted. An entry with a field outside
 * the contract is rejected, not dropped, so no caller already sends a field a
 * later release starts to read.
 */
export declare function validateSessionHistory(history: unknown): readonly SessionHistoryMessage[] | undefined;
