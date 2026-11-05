import type { ScheduleEnvelope } from "#public/schedules/subscription.js";
export interface ScheduleCollectionPayload<TPayload = unknown> {
    readonly eve: {
        readonly application: string;
        readonly collection: string;
        readonly version: 3;
    };
    readonly envelope: ScheduleEnvelope<TPayload>;
}
export declare function createScheduleCollectionPayload<TPayload>(input: {
    readonly application: string;
    readonly collection: string;
    readonly envelope: ScheduleEnvelope<TPayload>;
}): ScheduleCollectionPayload<TPayload>;
export declare function parseSchedulePayload<TPayload = unknown>(value: unknown, expected?: {
    readonly application: string;
    readonly collection: string;
}): ScheduleCollectionPayload<TPayload>;
/** Shared validation for client writes and delivered occurrences. */
export declare function validateSchedulePayload<T>(schema: {
    readonly "~standard": {
        validate(value: unknown): unknown;
    };
}, value: unknown): Promise<T>;
