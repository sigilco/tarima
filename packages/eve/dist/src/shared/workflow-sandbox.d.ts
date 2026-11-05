import type * as RunModule from "#compiled/run/index.js";
type WorkflowSandboxModule = Pick<typeof RunModule, "createRunner" | "createSignedContinuationCodec" | "getHostFunctionContext" | "RunError">;
export declare function installWorkflowSandboxModule(module: WorkflowSandboxModule): void;
/**
 * Returns the vendored `run` runtime that executes generated workflow
 * programs. eve's host installs it for agents with a generated-program tool,
 * so hosts without one never bundle it.
 */
export declare function loadWorkflowSandboxModule(): Promise<WorkflowSandboxModule>;
export {};
