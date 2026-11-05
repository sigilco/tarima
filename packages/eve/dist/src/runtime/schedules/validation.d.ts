import type { ScheduleExpression, ScheduleTiming } from "#public/schedules/subscription.js";
export declare function validateScheduleName(name: string): string;
export declare const MAX_SCHEDULE_DELAY_MINUTES = 525600;
export declare function resolveScheduleTiming(timing: ScheduleTiming, now?: number): ScheduleExpression;
export declare function validateScheduleExpression(expression: ScheduleExpression): ScheduleExpression;
export declare function validateScheduleListLimit(limit: number | undefined): number | undefined;
