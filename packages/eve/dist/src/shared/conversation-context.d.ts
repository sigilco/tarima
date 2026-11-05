import type { InstrumentationChannelKind } from "#shared/instrumentation-channel.js";
import { ContextKey } from "#context/key.js";
import { type ChannelAudience } from "#shared/channel-audience.js";
import type { ForwardedTraceAssertion } from "#shared/forwarded-trace-policy.js";
export type ConversationEnvironment = "development" | "preview" | "production";
export interface ConversationContext {
    readonly channel: {
        readonly kind: InstrumentationChannelKind;
        readonly name?: string;
    };
    readonly audience: ChannelAudience;
    readonly environment: ConversationEnvironment;
    readonly principalType: string;
}
export type AudienceCaller = {
    readonly type: "anonymous";
} | {
    readonly type: "principal";
    readonly principal: {
        readonly kind: string;
        readonly authenticator: string;
        readonly attributes: Readonly<Record<string, string | readonly string[]>>;
    };
};
/** Privacy-limited input for conversation audience classification. */
export interface AudienceContext<TState> {
    readonly state: TState;
    readonly caller: AudienceCaller;
    readonly channel: ConversationContext["channel"];
    readonly environment: ConversationEnvironment;
}
/** Safe projection for durable sessions created before `eve.conversation` existed. */
export declare const UNKNOWN_CONVERSATION_CONTEXT: ConversationContext;
interface ConversationContextFallback {
    readonly channelKind?: string;
    readonly environment: ConversationEnvironment;
    readonly forwardedTracePolicy?: ForwardedTraceAssertion;
    readonly principalType?: string;
}
/**
 * Reconstructs a durable conversation when its key predates the key itself.
 * All callers must use this helper so legacy sessions resolve privacy fields
 * from one source of truth.
 */
export declare function resolveConversationContext(stored: ConversationContext | undefined, fallback: ConversationContextFallback, options?: {
    readonly forwardedOverridesStored?: boolean;
}): ConversationContext;
export declare const ConversationContextKey: ContextKey<ConversationContext>;
export declare function normalizeConversationContext(value: unknown): ConversationContext | undefined;
export {};
