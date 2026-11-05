import type { StandardSchemaV1 } from "#compiled/@standard-schema/spec/index.js";
import type { DynamicSchedulesDefinition } from "#public/schedules/subscription.js";
import type { DynamicToolEntry } from "#tools/dynamic.js";
/**
 * The tools a schedule collection offers the model, named `schedule__<collection>__<action>`, or
 * `null` when its `tool` is `false`.
 */
export declare function scheduleCollectionTools<TInput, TPrepared = TInput>(definition: DynamicSchedulesDefinition<TInput, StandardSchemaV1<unknown, TInput>, TPrepared>, collection: string): Record<string, DynamicToolEntry> | null;
