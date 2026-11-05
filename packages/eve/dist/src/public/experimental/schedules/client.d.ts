import type { StandardSchemaV1 } from "#compiled/@standard-schema/spec/index.js";
import type { DefinedDynamicSchedules, ScheduleClient } from "#public/schedules/subscription.js";
import { type ScheduleCollectionClient } from "#runtime/schedules/collection-client.js";
/** Binds a registered subscription to a scope authorized on every operation. */
export declare function schedules<TPayload, TPrepared = TPayload>(collection: DefinedDynamicSchedules<TPayload, StandardSchemaV1<unknown, TPayload>, TPrepared>): Promise<ScheduleClient<TPayload>>;
/** Shared binding for model approval preview and code-only client access. */
export declare function bindScheduleCollection<TPayload, TPrepared = TPayload>(collection: DefinedDynamicSchedules<TPayload, StandardSchemaV1<unknown, TPayload>, TPrepared>): Promise<ScheduleCollectionClient<TPayload, TPrepared>>;
