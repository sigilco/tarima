import type { ConversationState } from "#client/conversation-state.js";
import type { SendTurnPayload } from "#client/types.js";
import type { MessageContent } from "#shared/message-content.js";
/** A server ignores answers to requests it already settled, so the store never sends them. */
export declare function assertAnswerable(input: SendTurnPayload, conversation: ConversationState): void;
export declare function assertExclusiveTurnInput(input: SendTurnPayload): void;
export declare function summarizeMessage(message: MessageContent): string;
export declare function isAbortError(error: unknown): boolean;
