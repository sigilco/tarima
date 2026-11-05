import type { UserPart } from "#protocol/session-events/envelope.js";
import type { MessageContent } from "#shared/message-content.js";
/** The parts of one message. */
export declare function userPartsOf(message: MessageContent): readonly UserPart[];
