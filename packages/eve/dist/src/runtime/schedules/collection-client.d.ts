import type { StandardSchemaV1 } from "#compiled/@standard-schema/spec/index.js";
import type { ScheduleClient, ScheduleClientCreate, ScheduleClientUpdate, DynamicSchedulesDefinition, ScheduleEnvelope, ScheduleScopeContext } from "#public/schedules/subscription.js";
export interface ScheduleBoundCallContext extends ScheduleScopeContext {
    readonly application: string;
    readonly collection: string;
    readonly operationId?: () => string;
}
export interface PreparedScheduleCreate<TPrepared = unknown> {
    readonly displayName: string;
    readonly expression: import("#public/schedules/subscription.js").ScheduleTiming;
    readonly envelope: ScheduleEnvelope<TPrepared>;
}
export interface PreparedScheduleUpdate<TPrepared = unknown> {
    readonly name: string;
    readonly namespace: string;
    readonly expression?: import("#public/schedules/subscription.js").ScheduleTiming;
    readonly envelope?: ScheduleEnvelope<TPrepared>;
}
export type PreparedScheduleWrite = PreparedScheduleCreate | PreparedScheduleUpdate;
/** Internal preparation capabilities used by generated write approval. */
export interface ScheduleCollectionClient<TInput, TPrepared> extends ScheduleClient<TInput> {
    prepareCreate(input: ScheduleClientCreate<unknown>): Promise<PreparedScheduleCreate<TPrepared>>;
    create(input: ScheduleClientCreate<TInput>, approved?: PreparedScheduleCreate): Promise<import("#public/schedules/subscription.js").ScheduleRecord>;
    prepareUpdate(name: string, patch: ScheduleClientUpdate<unknown>): Promise<PreparedScheduleUpdate<TPrepared>>;
    update(name: string, patch: ScheduleClientUpdate<TInput>, approved?: PreparedScheduleUpdate): Promise<import("#public/schedules/subscription.js").ScheduleRecord>;
}
export declare function createScheduleCollectionClient<TPayload, TPrepared = TPayload>(definition: DynamicSchedulesDefinition<TPayload, StandardSchemaV1<unknown, TPayload>, TPrepared>, callContext: ScheduleBoundCallContext): ScheduleCollectionClient<TPayload, TPrepared>;
