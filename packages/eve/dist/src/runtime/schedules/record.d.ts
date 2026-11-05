import type { ScheduleRecord } from "#public/schedules/subscription.js";
/** Provider names retain the readable label so get/list need no payload read-back. */
export declare function scheduleDisplayName(name: string): string;
export declare function projectScheduleRecord(record: ScheduleRecord): ScheduleRecord;
