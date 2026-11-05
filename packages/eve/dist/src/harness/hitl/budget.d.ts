import { type LimitAsk } from "#harness/hitl/budget-request.js";
import type { SessionProjection } from "#protocol/session-projection.js";
import type { HarnessSession } from "#harness/types.js";
import type { SessionUsageLimit } from "#shared/agent-definition.js";
import type { JsonObject } from "#shared/json.js";
import type { TokenUsage } from "#shared/token-usage.js";
/** Cache reads replay history rather than spending new input. Cache writes still count. */
export declare const DEFAULT_SESSION_USAGE_LIMIT: SessionUsageLimit;
export type SessionUsageLimitCheck = {
    readonly kind: "within";
} | {
    readonly kind: "ask";
    readonly ask: LimitAsk;
} | {
    readonly kind: "fail";
    readonly code: string;
    readonly details: JsonObject;
    readonly message: string;
};
export declare function checkSessionUsageLimit(input: {
    readonly canAsk: boolean;
    readonly limit: SessionUsageLimit;
    readonly session: Pick<HarnessSession, "sessionId" | "state">;
    readonly turnSequence: number;
    readonly usage: TokenUsage;
    /** The window the last accepted budget prompt started; the stored one by default. */
    readonly window?: SessionProjection["usageWindow"];
}): SessionUsageLimitCheck;
