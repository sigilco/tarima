import type { ScheduleProvider } from "#public/schedules/subscription.js";
export interface InMemoryScheduleProviderOptions {
    readonly now?: () => Date;
}
export declare function inMemoryScheduleProvider(options?: InMemoryScheduleProviderOptions): ScheduleProvider;
