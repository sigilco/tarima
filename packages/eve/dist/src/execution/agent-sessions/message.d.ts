import type { JsonObject } from "#shared/json.js";
import { type MessageContent, type MessagePart } from "#shared/message-content.js";
/** Workflow messages carry references, not attachment bytes, through durable step inputs. */
export declare function normalizeAgentMessage(message: MessageContent<string | URL>): string | readonly (MessagePart<string> & JsonObject)[];
