import type { EveMessagePart, EveToolPart } from "#client/message-types.js";
export declare function isTerminalToolCallPart(part: EveMessagePart): part is EveToolPart;
