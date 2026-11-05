/**
 * The pinned message-queue panel: messages submitted while the agent is still
 * starting. Each queued message waits for the agent to become ready, where the
 * whole queue coalesces into the first turn's message.
 */
import type { Theme } from "./theme.js";
/** Most messages the queue holds; Enter on a full queue keeps the draft. */
export declare const MESSAGE_QUEUE_LIMIT = 5;
/** Read-only projection consumed by {@link renderMessageQueueRows}. */
export interface MessageQueueView {
    readonly messages: readonly string[];
    readonly full: boolean;
}
export declare class MessageQueue {
    #private;
    get full(): boolean;
    /** Queues one message; returns false (draft stays put) when full. */
    enqueue(message: string): boolean;
    /** Every queued message coalesced into one prompt; clears the queue. */
    takePrompt(): string | undefined;
    view(): MessageQueueView;
}
export interface MessageQueuePanelRowsInput {
    readonly view: MessageQueueView;
    readonly width: number;
    readonly theme: Theme;
}
/**
 * Paints the pinned queue panel, indented so its marks share the tool
 * column. Queued messages ride a `│` rail under the header (one clipped
 * line each) and the last closes it with `└`.
 */
export declare function renderMessageQueueRows(input: MessageQueuePanelRowsInput): string[];
