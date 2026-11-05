import type { DynamicSchedulesDefinition, ScheduleOccurrenceIdentity } from "#public/schedules/subscription.js";
import type { ScheduleCollectionPayload } from "#runtime/schedules/payload.js";
import type { CompiledRuntimeAgentBundle } from "#runtime/sessions/compiled-agent-cache.js";
/** Dispatches an at-least-once callback and reports the sessions it started, if any. */
export declare function dispatchScheduledOccurrence(input: {
    readonly bundle: Pick<CompiledRuntimeAgentBundle, "compiledArtifactsSource" | "graph">;
    readonly collection: string;
    readonly definition: DynamicSchedulesDefinition<any, any, any>;
    readonly occurrence: ScheduleOccurrenceIdentity;
    readonly payload: ScheduleCollectionPayload<unknown>;
    readonly verifyDelivery?: () => Promise<void>;
}): Promise<void>;
