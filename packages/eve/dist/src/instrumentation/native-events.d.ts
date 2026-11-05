import type { DeliverHookPayload } from "#channel/types.js";
import type { InstrumentationScope, InstrumentationHooks, InstrumentationParentLineage, InstrumentationTraceContext } from "#instrumentation/lifecycle.js";
import type { HandleEventFn } from "#harness/types.js";
import { type ChannelAudience } from "#shared/channel-audience.js";
import type { ConversationEnvironment } from "#shared/conversation-context.js";
export interface CreateInstrumentationHandleEventInput {
    readonly deliveryInput?: DeliverHookPayload;
    readonly isFrameworkTool?: (name: string) => boolean;
    readonly functionId?: string;
    readonly traceSessionId?: string;
    readonly agentName?: string;
    readonly channelKind?: string;
    readonly channelAudience?: ChannelAudience;
    /** With `channelAudience`, whether principal ids may be recorded; absent counts as production. */
    readonly environment?: ConversationEnvironment;
    readonly handleEvent?: HandleEventFn;
    readonly hooks?: InstrumentationHooks;
    readonly parentLineage?: InstrumentationParentLineage;
    readonly parentTraceContext?: InstrumentationTraceContext;
    readonly rootSessionId?: string;
    readonly scheduleId?: string;
    readonly sessionId: string;
    readonly title?: string;
}
/** Where an attempt is in its session: its turn, its step, and which try at the step it is. */
export interface AttemptPlace {
    readonly runId: string;
    readonly turnId?: string;
    readonly stepIndex?: number;
    readonly attempt: number;
}
/** An attempt's scope: the session it runs in, and its place. */
export declare function attemptScopeOf(session: Pick<CreateInstrumentationHandleEventInput, "channelAudience" | "functionId" | "rootSessionId" | "sessionId" | "traceSessionId">, { runId, attempt, stepIndex, turnId }: AttemptPlace): InstrumentationScope;
/**
 * Publishes each committed fact's instrumentation events once the publication folds it. The
 * events are a function of the fact and the tables after it: a call's or a request's attempt is
 * its run's current one, the attempt that produced it.
 */
export declare function createInstrumentationHandleEvent(input: CreateInstrumentationHandleEventInput): HandleEventFn | undefined;
