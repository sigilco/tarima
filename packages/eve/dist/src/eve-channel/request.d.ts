import { type MessageContent } from "#shared/message-content.js";
import type { SessionAuthContext, SessionCallback, TurnPolicy } from "#channel/types.js";
import type { Session } from "#channel/session.js";
import type { ClientContextValue } from "#eve-channel/types.js";
import { type UploadPolicy } from "#public/channels/upload-policy.js";
import { type ValidatedAnswer } from "#shared/input.js";
import { type JsonObject } from "#shared/json.js";
import { type ParsedCreateBody } from "#eve-channel/create-request.js";
/** Replay-stable identity for one authenticated create operation. */
export declare function deriveOperationContinuationToken(input: {
    readonly auth: SessionAuthContext;
    readonly operationId: string;
}): Promise<string>;
export declare function parseCreateBody(input: Record<string, unknown>): ParsedCreateBody | Response;
interface ParsedSessionMessageBody {
    inbox?: string;
    callback?: SessionCallback;
    /** Names the delivery: a repeat with the same key is the same delivery, with the same receipt. */
    idempotencyKey?: string;
    message?: MessageContent;
    answers?: readonly ValidatedAnswer[];
    context?: ClientContextValue;
    outputSchema?: JsonObject;
    turnPolicy?: TurnPolicy;
}
export declare function parseSessionMessageBody(input: Record<string, unknown>): ParsedSessionMessageBody | Response;
interface ParsedCancelTurnBody {
    turnId?: string | null;
}
export declare function parseCancelTurnBody(req: Request): Promise<ParsedCancelTurnBody | Response>;
export declare function parseResetBody(req: Request): Promise<{
    readonly reason?: string;
} | Response>;
export declare function parseSessionControlBody(req: Request): Promise<Record<string, unknown> | Response>;
export declare function parseOptionalJsonRequest(req: Request): Promise<Record<string, unknown> | Response>;
export declare function requireSessionId(params: Readonly<Record<string, string>>): string | Response;
export declare function createSessionStreamResponse(request: Request, session: Session): Promise<Response>;
export declare function checkUploadPolicy(body: ParsedCreateBody | ParsedSessionMessageBody, policy: UploadPolicy): Response | null;
export declare function parseIncludeTailIndex(request: Request): boolean;
export declare function parseStartIndex(request: Request): number | undefined | Response;
export {};
