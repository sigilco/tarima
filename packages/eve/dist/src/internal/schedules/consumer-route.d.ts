import type { CompiledAgentManifest } from "#compiler/manifest.js";
export declare const EVE_SCHEDULE_COLLECTION_CONSUMER_ROUTE_PATH = "/.well-known/eve/v1/schedules/consumer";
/** Deliveries the queue attempts before giving up on an occurrence. */
export declare const EVE_SCHEDULE_CONSUMER_MAX_DELIVERIES = 10;
/** The queue trigger that delivers an agent's scheduled occurrences to its consumer. */
export declare function createEveScheduleQueueTrigger(agentName: string): {
    type: "queue/v2beta";
    topic: string;
    retryAfterSeconds: number;
    initialDelaySeconds: number;
    maxDeliveries: number;
};
export declare function usesLocalVercelSchedules(manifest: Pick<CompiledAgentManifest, "scheduleCollections">): boolean;
/** Whether a build needs the Vercel schedule consumer: its route and its queue trigger. */
export declare function hasVercelScheduleCollections(manifest: {
    readonly scheduleCollections?: readonly {
        readonly providerKind: string;
    }[];
}): boolean;
