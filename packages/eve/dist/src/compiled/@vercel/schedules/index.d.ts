interface SchedulesApiClientOptions {
    baseUrl?: string;
    token?: string;
    fetch?: typeof fetch;
    /**
     * Headers sent with every request. They cannot replace the headers the
     * client sets itself: `Authorization`, `Content-Type`, and `x-vss-client`.
     */
    headers?: HeadersInit;
}
interface SchedulesApiErrorOptions {
    /** Machine-readable error code from the API, such as `not_found`. */
    code?: string;
    /** Seconds to wait before retrying, from the `Retry-After` header. */
    retryAfter?: number;
}
declare class SchedulesApiError extends Error {
    readonly status: number;
    readonly code?: string;
    readonly retryAfter?: number;
    constructor(status: number, message: string, options?: SchedulesApiErrorOptions);
}
declare class SchedulesApiClient {
    private readonly baseUrl?;
    private readonly token?;
    private readonly fetchImpl;
    private readonly headers;
    private readonly configurationError?;
    constructor(options?: SchedulesApiClientOptions);
    protected getToken(): Promise<string>;
    protected request<T>(method: string, path: string, body?: unknown): Promise<T>;
}

declare const DEFAULT_SCHEDULES_BASE_URL = "https://vercel-schedules.com";

type ScheduleExpression = {
    type: 'cron';
    cron: string;
} | {
    type: 'single';
    /** Datetime in YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:00 format, with no timezone suffix. */
    at: string;
};
type ScheduleTarget = {
    type: 'queue';
    topic: string;
} | {
    type: 'function';
    function: string;
    /** Service the function belongs to; `function` is the path within it. */
    service?: string;
} | {
    type: 'path';
    path: string;
    /** HTTP method used to invoke the path. Dispatch defaults to `POST`. */
    requestMethod?: 'GET' | 'POST';
};
type CreateScheduleTarget = {
    topic: string;
};
type ScheduleState = 'active' | 'inactive';
type ScheduleSource = 'static' | 'dynamic';
interface Schedule {
    scheduleId: string;
    ownerId: string;
    projectId: string;
    name: string;
    namespace: string;
    expression: ScheduleExpression;
    /** IANA timezone used for cron expressions and one-time schedules. */
    timezone: string;
    jitter?: number;
    target: ScheduleTarget;
    state: ScheduleState;
    /**
     * Unix ms when this schedule is disabled again, if it was enabled with
     * `until`. Present only while `state` is `active` and the time is in the
     * future.
     */
    activeUntil?: number;
    source: ScheduleSource;
    createdAt: number;
    updatedAt: number;
}
interface CreateScheduleParams {
    name: string;
    namespace?: string;
    expression: ScheduleExpression;
    /** IANA timezone for cron expressions and local one-time schedules. Defaults to UTC. */
    timezone?: string;
    jitter?: number;
    target: CreateScheduleTarget;
    payload?: unknown;
}
type CreateScheduleResponse = Schedule & {
    target: Extract<ScheduleTarget, {
        type: 'queue';
    }>;
};
interface ScheduleIdentifier {
    name: string;
    namespace?: string;
}
interface UpdateScheduleParams extends ScheduleIdentifier {
    expression?: ScheduleExpression;
    timezone?: string;
    jitter?: number | null;
    target?: CreateScheduleTarget;
    payload?: unknown;
}
type UpdateScheduleResponse = Schedule;
interface EnableScheduleParams extends ScheduleIdentifier {
    /**
     * Enable the schedule only until this time (a `Date` or Unix ms), after
     * which it is disabled again. Replaces the time on a schedule already
     * enabled until one. Must be in the future, and a schedule already enabled
     * without one is rejected with `schedule_already_active`. Omit to enable
     * the schedule indefinitely, which also clears any existing time.
     */
    until?: Date | number;
}
type InvokeScheduleParams = ScheduleIdentifier;
interface ListSchedulesParams {
    namespace?: string;
    cursor?: string;
    limit?: number;
}
interface ListSchedulesResponse {
    data: Schedule[];
    cursor: string | null;
}

declare class SchedulesClient extends SchedulesApiClient {
    create({ target, ...params }: CreateScheduleParams): Promise<CreateScheduleResponse>;
    list(params?: ListSchedulesParams): Promise<ListSchedulesResponse>;
    get({ name, namespace }: ScheduleIdentifier): Promise<Schedule>;
    update({ name, namespace, target, ...params }: UpdateScheduleParams): Promise<UpdateScheduleResponse>;
    delete({ name, namespace }: ScheduleIdentifier): Promise<void>;
    enable({ name, namespace, until }: EnableScheduleParams): Promise<Schedule>;
    disable({ name, namespace }: ScheduleIdentifier): Promise<Schedule>;
    invoke({ name, namespace }: InvokeScheduleParams): Promise<void>;
}

declare const schedules: SchedulesClient;

/** CloudEvent type used for schedule function dispatches. */
declare const SCHEDULE_CLOUD_EVENT_TYPE = "com.vercel.schedule.v1beta";
declare const CLOUD_EVENT_SPEC_VERSION_HEADER = "ce-specversion";
declare const CLOUD_EVENT_TYPE_HEADER = "ce-type";
declare const CLOUD_EVENT_SOURCE_HEADER = "ce-source";
declare const CLOUD_EVENT_ID_HEADER = "ce-id";
declare const SCHEDULE_SCHEDULED_AT_HEADER = "ce-vssscheduledat";
declare const SCHEDULE_ID_HEADER = "ce-vssscheduleid";
declare const SCHEDULE_NAME_HEADER = "ce-vssschedulename";
declare const SCHEDULE_NAMESPACE_HEADER = "ce-vssnamespace";
declare const SCHEDULE_SOURCE_HEADER = "ce-vssschedulesource";
declare const SCHEDULE_EXPRESSION_HEADER = "ce-vssexpression";
interface ScheduleMetadata {
    /** Unique identifier of the schedule. */
    scheduleId: string;
    /** Unique identifier for this schedule occurrence. */
    executionId: string;
    /** Schedule name, unique within its project and namespace. */
    name: string;
    /** Namespace the schedule belongs to. */
    namespace: string;
    /**
     * Nominal scheduled time for this occurrence, based on the schedule expression.
     * Does not account for jitter. The dispatch may arrive later within the jitter window.
     */
    scheduledAt: Date;
    /** How the schedule was defined, such as `static`. */
    source: string;
    /** The schedule's cron expression, or the local datetime of a one-time schedule. */
    expression: string;
}
type ScheduleHandler = (metadata: ScheduleMetadata, request: Request) => void | Promise<void>;
declare class ScheduleEventParseError extends Error {
    cause?: unknown;
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
/** Parses schedule metadata from a binary-mode schedule CloudEvent. */
declare function parseScheduleEvent(request: Request): Promise<ScheduleMetadata>;
/**
 * Creates a web-standard route handler for schedule dispatches.
 *
 * ```ts
 * export const POST = handleSchedule(async (metadata, request) => {
 *   console.log(metadata.name, metadata.scheduledAt);
 * });
 * ```
 */
declare function handleSchedule(handler: ScheduleHandler): (request: Request) => Promise<Response>;

export { CLOUD_EVENT_ID_HEADER, CLOUD_EVENT_SOURCE_HEADER, CLOUD_EVENT_SPEC_VERSION_HEADER, CLOUD_EVENT_TYPE_HEADER, type CreateScheduleParams, type CreateScheduleResponse, type CreateScheduleTarget, DEFAULT_SCHEDULES_BASE_URL, type EnableScheduleParams, type InvokeScheduleParams, type ListSchedulesParams, type ListSchedulesResponse, SCHEDULE_CLOUD_EVENT_TYPE, SCHEDULE_EXPRESSION_HEADER, SCHEDULE_ID_HEADER, SCHEDULE_NAMESPACE_HEADER, SCHEDULE_NAME_HEADER, SCHEDULE_SCHEDULED_AT_HEADER, SCHEDULE_SOURCE_HEADER, type Schedule, ScheduleEventParseError, type ScheduleExpression, type ScheduleHandler, type ScheduleIdentifier, type ScheduleMetadata, type ScheduleSource, type ScheduleState, type ScheduleTarget, schedules as Schedules, type SchedulesApiClientOptions, SchedulesApiError, type SchedulesApiErrorOptions, SchedulesClient, type UpdateScheduleParams, type UpdateScheduleResponse, handleSchedule, parseScheduleEvent };
