import { type ApplicationInspection } from "#services/inspect-application.js";
import type { JsonObject } from "#shared/json.js";
interface CliInfoLogger {
    log(message: string): void;
}
/** Options accepted by {@link printApplicationInfo}. */
export interface PrintApplicationInfoOptions {
    /** Emit a machine-readable JSON document instead of the human table. */
    json?: boolean;
}
/** Machine-readable view of an application inspection, emitted by `eve info --json`. */
export interface ApplicationInfoJson {
    appRoot: string;
    agentRoot: string | null;
    layout: string | null;
    status: string;
    diagnostics: {
        errors: number;
        warnings: number;
    } | null;
    model: string | null;
    instructions: string | null;
    skills: string[];
    tools: string[];
    /** Each static tool's input schema as eve sends it to a model, keyed by tool name. */
    toolInputSchemas: {
        /** The root agent's tools, including tools from mounted extensions. */
        root: Record<string, JsonObject>;
        /**
         * Each declared subagent's own tools, keyed by the subagent's path of names
         * from the root agent, such as `researcher` or `researcher/reviewer`.
         */
        subagents: Record<string, Record<string, JsonObject>>;
    };
    subagents: string[];
    schedules: string[];
    channels: {
        name: string;
        kind: string | null;
        method: string | null;
        urlPath: string | null;
    }[];
    messaging: {
        create: string;
        messages: string;
        stream: string;
    };
    artifacts: {
        compiledManifest: string;
        discoveryManifest: string;
        diagnostics: string;
        moduleMap: string;
        metadata: string;
    } | null;
}
/**
 * Projects a structured inspection into the stable `eve info --json` contract.
 * Tools and channels an agent relies on to verify setup come straight from the
 * compiled manifest, so this stays in sync with what the runtime actually serves.
 */
export declare function buildApplicationInfoJson(inspection: ApplicationInspection): ApplicationInfoJson;
/**
 * Writes resolved application details and the active message-route contract.
 */
export declare function printApplicationInfo(logger: CliInfoLogger, appRoot: string, options?: PrintApplicationInfoOptions): Promise<void>;
/** Renders the human-readable `eve info` report for CLI and TUI surfaces. */
export declare function renderApplicationInfo(inspection: ApplicationInspection): string;
export {};
