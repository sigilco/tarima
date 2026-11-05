export type EveCliSetupFlow = "init" | "extension_init" | "onboarding";
export type EveCliSetupStep = "resolve_target" | "scaffold" | "install_dependencies" | "initialize_git" | "handoff" | "connection_ready" | "first_response" | "model_provider" | "model_settings" | "registry_channels" | "registry_integrations" | "registry_review" | "registry_install";
export type EveCliSetupTerminalResult = "completed" | "cancelled" | "error";
/** A bounded, non-sensitive reason for a failed setup terminal event. */
export type EveCliSetupFailureCode = "target_resolution" | "target_conflict" | "target_invalid" | "target_filesystem" | "workspace_input" | "scaffolding" | "package_manager_not_found" | "package_manager_start_failed" | "workspace_probe_failed" | "workspace_probe_unrecognized" | "dependency_installation" | "git_initialization" | "handoff" | "onboarding";
export type EveCliSetupStepEvent = {
    flow: EveCliSetupFlow;
    step: EveCliSetupStep;
    registrySelectedCount?: number;
};
export type EveCliSetupTerminalEvent = {
    flow: EveCliSetupFlow;
    step: EveCliSetupStep;
    result: EveCliSetupTerminalResult;
    failureCode?: EveCliSetupFailureCode;
};
export type EveCliTelemetry = {
    trackCommand(command: string): void;
    trackDevContext(context: {
        target: "local" | "remote";
        ui: "tui" | "headless";
    }): void;
    trackSetupStep(input: EveCliSetupStepEvent): void;
    trackSetupTerminal(input: EveCliSetupTerminalEvent): void;
    trackOutcome(outcome: "success" | "usage_error" | "error"): void;
    notify(logger: {
        error(message: string): void;
    }): Promise<void>;
    flush(): Promise<void>;
};
/** Explicit privacy allowlist for command values emitted by CLI telemetry. */
export declare const cliTelemetryCommandPaths: Set<string>;
/** Internal command paths that must never emit telemetry. */
export declare const internalCliCommandPaths: Set<string>;
/** Returns only an allowlisted command path; it never includes user input. */
export declare function canonicalCommand(argv: readonly string[]): string;
export declare function createEveCliTelemetry(version: string): EveCliTelemetry;
