export type DatadogJsonValue = string | number | boolean | null | DatadogJsonValue[] | {
    [key: string]: DatadogJsonValue;
};
export interface DatadogDatasetRecordInput {
    inputData: DatadogJsonValue;
    expectedOutput?: DatadogJsonValue;
    metadata?: Record<string, DatadogJsonValue>;
    tags?: string[];
}
export interface DatadogDatasetRecord {
    readonly id: string | null;
    readonly input: DatadogJsonValue;
    readonly expectedOutput: DatadogJsonValue;
    readonly metadata: Record<string, DatadogJsonValue>;
}
export interface DatadogDatasetRecordFields {
    input: DatadogJsonValue;
    expectedOutput: DatadogJsonValue;
    metadata: Record<string, DatadogJsonValue>;
}
export interface DatadogDataset {
    id(): string | null;
    name(): string;
    version(): number | null;
    latestVersion(): number | null;
    records(): readonly DatadogDatasetRecord[];
    addRecords(records: DatadogDatasetRecordInput[]): DatadogDataset;
    update(index: number, fields: Partial<DatadogDatasetRecordFields>): DatadogDataset;
    url(): string | null;
    push(): Promise<{
        pushedCount: number;
        totalCount: number;
    }>;
}
export interface DatadogExperimentsClient {
    createDataset?(name: string, options?: {
        projectName?: string;
        description?: string;
    }): DatadogDataset;
    pullDataset?(name: string, options?: {
        projectName?: string;
        maxWaitMs?: number;
    }): Promise<DatadogDataset>;
    startExperiment(options: DatadogStartExperimentOptions): Promise<DatadogExternalExperiment>;
}
export interface DatadogStartExperimentOptions {
    name: string;
    projectName?: string;
    description?: string;
    tags?: Record<string, string>;
    metadata?: Record<string, DatadogJsonValue>;
    config?: Record<string, DatadogJsonValue>;
    dataset?: {
        id?: string;
        version?: number;
        name?: string;
        description?: string;
    };
}
export interface DatadogExternalExperiment {
    experimentId(): string;
    url(): string | null;
    submitSpan(row: DatadogExternalExperimentSpanInput): Promise<DatadogExternalExperimentSpan>;
    submitEvaluationMetrics(span: Pick<DatadogExternalExperimentSpan, "experimentId" | "spanId" | "traceId">, metrics: DatadogEvaluationMetricInput[]): Promise<void>;
    close(options?: {
        status?: string;
        error?: string | Error;
    }): Promise<void>;
}
export interface DatadogExternalExperimentSpanInput {
    name?: string;
    input?: DatadogJsonValue;
    output?: DatadogJsonValue;
    expectedOutput?: DatadogJsonValue;
    metadata?: Record<string, DatadogJsonValue>;
    tags?: Record<string, string>;
    startedAt?: Date | string | number;
    completedAt?: Date | string | number;
    durationMs?: number;
    error?: string | Error | {
        type?: string;
        name?: string;
        message?: string;
        stack?: string;
    };
    datasetRecordId?: string;
    runId?: string;
    runIteration?: number;
}
interface DatadogExternalExperimentSpan {
    experimentId: string;
    spanId: string;
    traceId: string;
    url: string | null;
}
export interface DatadogEvaluationMetricInput {
    label: string;
    value?: DatadogJsonValue;
    error?: string | Error;
    timestamp?: Date | string | number;
    tags?: Record<string, string>;
    source?: string;
}
/** Options used when eve initializes `dd-trace` itself. */
export interface DatadogClientConfig {
    readonly client?: DatadogExperimentsClient;
    readonly service?: string;
    readonly env?: string;
    readonly site?: string;
    readonly mlApp?: string;
}
export declare const MISSING_DATASET_API_MESSAGE: string;
/** Pulls the named dataset, creating it when Datadog has no dataset with that name. */
export declare function getDatadogDataset(client: DatadogExperimentsClient, name: string, options: {
    projectName?: string;
    description: string;
}): Promise<DatadogDataset>;
/** Returns `config.client`, or initializes `dd-trace` and returns its experiments API. */
export declare function resolveDatadogClient(config: DatadogClientConfig, projectName: string): Promise<DatadogExperimentsClient>;
export declare function toOptionalDatadogJsonValue(value: unknown): DatadogJsonValue | undefined;
export declare function toDatadogJsonRecord(value: Readonly<Record<string, unknown>> | undefined): Record<string, DatadogJsonValue> | undefined;
export declare function toDatadogJsonValue(value: unknown): DatadogJsonValue;
export {};
