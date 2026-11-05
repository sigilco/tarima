import type { EvalReporter } from "#evals/runner/reporters/types.js";
import { type DatadogExperimentsClient } from "#evals/runner/reporters/datadog-client.js";
/** Configuration for the Datadog reporter. */
export interface DatadogReporterConfig {
    /** Datadog LLM Observability project name. Defaults to `DD_LLMOBS_PROJECT_NAME`, the configured ml_app, `DD_SERVICE`, or the first eval id. */
    readonly projectName?: string;
    /** Dataset reused across runs. Defaults to `<projectName> evals`, or `<experimentName> dataset` without `recordInputs`. */
    readonly datasetName?: string;
    /** Name for the created experiment. Defaults to a timestamped eve eval run name. */
    readonly experimentName?: string;
    /** Optional experiment description. */
    readonly description?: string;
    /** Datadog service name used when the reporter initializes `dd-trace`. */
    readonly service?: string;
    /** Datadog env used when the reporter initializes `dd-trace`. */
    readonly env?: string;
    /** Datadog site used when the reporter initializes `dd-trace`. */
    readonly site?: string;
    /** LLM Observability ml_app used when the reporter initializes `dd-trace`. Defaults to `projectName`. */
    readonly mlApp?: string;
    /** Tags attached to the Datadog Experiment. */
    readonly tags?: Readonly<Record<string, string>>;
    /** JSON-serializable metadata attached to the Datadog Experiment. */
    readonly metadata?: Readonly<Record<string, unknown>>;
    /** JSON-serializable Datadog Experiment config. */
    readonly config?: Readonly<Record<string, unknown>>;
    /** Include the first sent message, falling back to the eval description, in the experiment row and a linked dataset record. Defaults to true. */
    readonly recordInputs?: boolean;
    /** Include eval outputs in the synthetic experiment row output. Defaults to true. */
    readonly recordOutputs?: boolean;
    /** Include `metadata.expectedOutput`, `metadata.expected`, or `metadata.expected_output` on experiment rows. Defaults to true. */
    readonly recordExpectedOutputs?: boolean;
    /** Include each assertion's name and score, and failure messages, in row metadata. Defaults to true. */
    readonly recordAssertionDetails?: boolean;
    /** Include execution error messages, which may contain application data. Defaults to true. */
    readonly recordErrors?: boolean;
    /** Console hook used for tests. */
    readonly log?: (line: string) => void;
    /** eve-owned client seam for tests and custom Datadog SDK wiring. */
    readonly client?: DatadogExperimentsClient;
}
/**
 * Creates an {@link EvalReporter} that uploads eval results to a Datadog LLM
 * Observability Experiment. Requires the optional `dd-trace`
 * package and `DD_API_KEY`/`DD_APP_KEY` credentials unless `config.client` is
 * provided.
 */
export declare function datadogReporter(config?: DatadogReporterConfig): EvalReporter;
