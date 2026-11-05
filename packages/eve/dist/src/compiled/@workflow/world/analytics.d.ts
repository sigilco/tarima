import { z } from '#compiled/zod/index.js';
import type { PaginatedResponse, PaginationOptions } from './shared.js';
export declare const AnalyticsRunSchema: z.ZodObject<{
    runId: z.ZodString;
    status: z.ZodEnum<{
        pending: "pending";
        running: "running";
        completed: "completed";
        failed: "failed";
        cancelled: "cancelled";
    }>;
    deploymentId: z.ZodString;
    workflowName: z.ZodString;
    specVersion: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    attributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    createdAt: z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>;
    updatedAt: z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>;
    startedAt: z.ZodOptional<z.ZodNullable<z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>>>;
    completedAt: z.ZodOptional<z.ZodNullable<z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>>>;
    errorCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    workflowCoreVersion: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    workflowEncryptionEnabled: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const AnalyticsStepSchema: z.ZodObject<{
    runId: z.ZodString;
    stepId: z.ZodString;
    stepName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodEnum<{
        pending: "pending";
        running: "running";
        completed: "completed";
        failed: "failed";
        cancelled: "cancelled";
    }>;
    attempt: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>;
    updatedAt: z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>;
    startedAt: z.ZodOptional<z.ZodNullable<z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>>>;
    completedAt: z.ZodOptional<z.ZodNullable<z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>>>;
    retryAfter: z.ZodOptional<z.ZodNullable<z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>>>;
    errorCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    workflowCoreVersion: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    workflowEncryptionEnabled: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    computeInstanceId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const AnalyticsEventSchema: z.ZodObject<{
    runId: z.ZodString;
    eventId: z.ZodString;
    eventType: z.ZodEnum<{
        run_created: "run_created";
        run_started: "run_started";
        run_completed: "run_completed";
        run_failed: "run_failed";
        run_cancelled: "run_cancelled";
        attr_set: "attr_set";
        step_created: "step_created";
        step_completed: "step_completed";
        step_failed: "step_failed";
        step_retrying: "step_retrying";
        step_started: "step_started";
        hook_created: "hook_created";
        hook_received: "hook_received";
        hook_disposed: "hook_disposed";
        hook_conflict: "hook_conflict";
        wait_created: "wait_created";
        wait_completed: "wait_completed";
        noop: "noop";
    }>;
    correlationId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    entityId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stepName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    workflowName: z.ZodString;
    deploymentId: z.ZodString;
    specVersion: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    runCreatedAt: z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>;
    createdAt: z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>;
    region: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    vercelId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    requestId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    computeInstanceId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    resumeAt: z.ZodOptional<z.ZodNullable<z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>>>;
    retryAfter: z.ZodOptional<z.ZodNullable<z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>>>;
    errorCode: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    workflowCoreVersion: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isWebhook: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    isSystem: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    workflowEncryptionEnabled: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const AnalyticsHookSchema: z.ZodObject<{
    runId: z.ZodString;
    hookId: z.ZodString;
    status: z.ZodEnum<{
        created: "created";
        received: "received";
        disposed: "disposed";
        conflict: "conflict";
    }>;
    createdAt: z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>;
    updatedAt: z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>;
    receivedAt: z.ZodOptional<z.ZodNullable<z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>>>;
    disposedAt: z.ZodOptional<z.ZodNullable<z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>>>;
    isWebhook: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    isSystem: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    workflowCoreVersion: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    workflowEncryptionEnabled: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const AnalyticsWaitSchema: z.ZodObject<{
    runId: z.ZodString;
    waitId: z.ZodString;
    status: z.ZodEnum<{
        completed: "completed";
        waiting: "waiting";
    }>;
    resumeAt: z.ZodOptional<z.ZodNullable<z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>>>;
    createdAt: z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>;
    updatedAt: z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>;
    completedAt: z.ZodOptional<z.ZodNullable<z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>>>;
    workflowCoreVersion: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    workflowEncryptionEnabled: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const AnalyticsAttributeKeySchema: z.ZodObject<{
    key: z.ZodString;
    runCount: z.ZodCoercedNumber<unknown>;
    firstSeenAt: z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>;
    lastSeenAt: z.ZodPreprocess<z.ZodCoercedDate<unknown>, unknown>;
}, z.core.$strip>;
export type AnalyticsRun = z.infer<typeof AnalyticsRunSchema>;
export type AnalyticsStep = z.infer<typeof AnalyticsStepSchema>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
export type AnalyticsHook = z.infer<typeof AnalyticsHookSchema>;
export type AnalyticsWait = z.infer<typeof AnalyticsWaitSchema>;
export type AnalyticsAttributeKey = z.infer<typeof AnalyticsAttributeKeySchema>;
export interface AnalyticsListRunsParams {
    workflowName?: string;
    status?: AnalyticsRun['status'];
    /**
     * Bound the listing to runs active between `startTime` and `endTime`
     * (ISO 8601 timestamps). Both must be provided together. A bounded window
     * lets the backend prune its scan, so the ClickHouse-backed Vercel
     * implementation is faster with one. Requesting a window
     * older than the plan's observability lookback fails with
     * `observability-upgrade-required`.
     */
    startTime?: string;
    endTime?: string;
    /**
     * Restrict the listing to runs whose latest attribute snapshot matches
     * every provided key=value pair (up to 8 pairs). Matching is
     * latest-write-wins: a run whose attribute moved from `v1` to `v2` no
     * longer matches `v1`. Reserved `$`-prefixed keys may be used in filters
     * even though user writes to that namespace are rejected.
     */
    attributes?: Record<string, string>;
    pagination?: PaginationOptions;
}
export interface AnalyticsListAttributesParams {
    workflowName?: string;
    /**
     * Bound the listing to attribute writes between `startTime` and `endTime`
     * (ISO 8601 timestamps). Both must be provided together. Requesting a
     * window older than the plan's observability lookback fails with
     * `observability-upgrade-required`.
     */
    startTime?: string;
    endTime?: string;
    pagination?: PaginationOptions;
}
export interface AnalyticsListRunScopedParams {
    runId: string;
    pagination?: PaginationOptions;
}
export interface AnalyticsListEventsParams extends AnalyticsListRunScopedParams {
    eventType?: AnalyticsEvent['eventType'];
    correlationId?: string;
}
/**
 * @deprecated Parameters of the deprecated `analytics.events.listByCorrelationId`.
 * Use `AnalyticsListEventsParams` with `list({ runId, correlationId })`.
 */
export interface AnalyticsListEventsByCorrelationIdParams {
    correlationId: string;
    /** The run the correlation id belongs to; see `ListEventsByCorrelationIdParams`. */
    runId: string;
    pagination?: PaginationOptions;
}
/** Maximum number of event IDs accepted by one analytics batch lookup. */
export declare const ANALYTICS_EVENTS_GET_MANY_LIMIT = 100;
/**
 * Maximum `pagination.limit` the run-scoped analytics listings accept:
 * `events.list`, `events.listByCorrelationId`, `steps.list`, `waits.list`.
 *
 * Exported so a World implementation can reject an over-large page before a
 * request goes out. The backend validates the same bound and answers 400, and
 * a caller that wraps the listing in a `catch` — the common shape, since
 * analytics is an optional capability — sees only a swallowed failure and an
 * empty result. Failing in-process with the bound named is diagnosable.
 */
export declare const ANALYTICS_RUN_SCOPED_PAGE_LIMIT = 1000;
/**
 * Maximum `pagination.limit` the remaining analytics listings accept:
 * `runs.list`, `attributes.list`, `hooks.list`.
 *
 * Deliberately separate from {@link ANALYTICS_RUN_SCOPED_PAGE_LIMIT}: these
 * listings scan across runs rather than within one, and the backend caps them
 * an order of magnitude lower. Two names beat one constant that is right for
 * half its call sites.
 */
export declare const ANALYTICS_PAGE_LIMIT = 100;
/**
 * Maximum key=value pairs one runs listing may filter by. Each pair adds an
 * aggregate condition to the backend's attribute prefilter, so the bound is
 * about query complexity rather than result size.
 */
export declare const ANALYTICS_MAX_ATTRIBUTE_FILTERS = 8;
export interface AnalyticsListHooksParams {
    runId: string;
    pagination?: PaginationOptions;
}
export interface AnalyticsListWaitsParams extends AnalyticsListRunScopedParams {
    status?: AnalyticsWait['status'];
}
export interface Analytics {
    runs: {
        get(runId: string): Promise<AnalyticsRun>;
        list(params?: AnalyticsListRunsParams): Promise<PaginatedResponse<AnalyticsRun>>;
    };
    attributes: {
        /**
         * List the distinct attribute keys observed on runs in the window,
         * with run counts and first/last seen timestamps. Ordered
         * alphabetically by key.
         */
        list(params?: AnalyticsListAttributesParams): Promise<PaginatedResponse<AnalyticsAttributeKey>>;
    };
    steps: {
        get(runId: string, stepId: string): Promise<AnalyticsStep>;
        list(params: AnalyticsListRunScopedParams): Promise<PaginatedResponse<AnalyticsStep>>;
    };
    events: {
        get(runId: string, eventId: string): Promise<AnalyticsEvent>;
        /**
         * Retrieves the analytics rows present for a bounded set of event IDs in
         * one run. Missing rows are omitted because analytics ingestion may lag
         * canonical storage. Duplicate IDs are looked up once; result ordering is
         * not guaranteed.
         */
        getMany(runId: string, eventIds: readonly string[]): Promise<AnalyticsEvent[]>;
        list(params: AnalyticsListEventsParams): Promise<PaginatedResponse<AnalyticsEvent>>;
        /**
         * @deprecated Use `list({ runId, correlationId })`, which issues the same
         * request and additionally accepts an `eventType` filter.
         *
         * This method was the analytics counterpart of the cross-run correlation
         * lookup, which took the correlation id alone. Requiring a `runId` (a
         * correlation id is unique per run, not globally) left it a special case
         * of `list` with no behaviour of its own. Scheduled for removal in the
         * next major.
         *
         * Note this is unrelated to the storage `events.listByCorrelationId`,
         * which is not deprecated and keeps a distinct endpoint.
         */
        listByCorrelationId(params: AnalyticsListEventsByCorrelationIdParams): Promise<PaginatedResponse<AnalyticsEvent>>;
    };
    hooks: {
        get(hookId: string, params?: {
            runId?: string;
        }): Promise<AnalyticsHook>;
        list(params: AnalyticsListHooksParams): Promise<PaginatedResponse<AnalyticsHook>>;
    };
    waits: {
        get(runId: string, waitId: string): Promise<AnalyticsWait>;
        list(params: AnalyticsListWaitsParams): Promise<PaginatedResponse<AnalyticsWait>>;
    };
}
//# sourceMappingURL=analytics.d.ts.map