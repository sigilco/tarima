import type { InstrumentationDecision } from "#shared/instrumentation-decision.js";
import type { ConversationEnvironment } from "#shared/conversation-context.js";
import type { ChannelAudience } from "#shared/channel-audience.js";
export interface InstrumentationContentContext {
    readonly audience: ChannelAudience;
    readonly environment: ConversationEnvironment;
}
/** Content is public evidence, or local debugging evidence in development. */
export declare function shouldCaptureInstrumentationContent(context: InstrumentationContentContext): boolean;
/** An explicit policy overrides defaults only for the audience it evaluated. */
export declare function applyAudienceCeiling(decision: InstrumentationDecision, context: InstrumentationContentContext): InstrumentationDecision;
