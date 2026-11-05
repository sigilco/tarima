import type { InteractionRequest } from "#protocol/session-events/families/interaction.js";
import type { ResponseValue } from "#protocol/session-events/families/response.js";
import type { JsonObject } from "#shared/json.js";
import type { TokenUsage } from "#shared/token-usage.js";
export interface LimitAsk {
    readonly interactionId: string;
    readonly request: InteractionRequest;
}
export declare function createSessionLimitContinuationRequest(input: {
    readonly sessionId: string;
    readonly turnSequence: number;
    readonly windowIndex: number;
}): LimitAsk;
export declare function toJsonUsage(usage: TokenUsage): JsonObject;
export declare function isSessionLimitContinuationRequestId(requestId: string): boolean;
export declare function limitDecision(answer: ResponseValue): {
    readonly granted: boolean;
} | undefined;
