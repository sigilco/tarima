import type { SetupPrerequisite } from "#setup/integrations/shared/prerequisite.js";
import type { Prompter } from "#setup/prompter.js";
import { detectDeployment } from "#setup/project-resolution.js";
import type { RegistrySetupCompletion, RegistrySetupFact } from "#setup/registry-setup-protocol.js";
import { runDeployFlow } from "./deploy.js";
interface RegistrySessionDeps {
    detectDeployment: typeof detectDeployment;
    runDeployFlow: typeof runDeployFlow;
}
export type RegistrySessionOutcome = {
    kind: "installed";
    title: string;
    facts: readonly RegistrySetupFact[];
    output: readonly string[];
}
/** Files were added, but the item's setup was cancelled, skipped, or failed. */
 | {
    kind: "incomplete";
    title: string;
    /** Registry address, used to resume setup without reinstalling. */
    address: string;
    resumeCommand: string;
    /** Why setup failed; absent when it was cancelled or skipped. */
    reason?: string;
    prerequisite?: SetupPrerequisite;
}
/** User-facing installation error, including any actionable follow-up lines. */
 | {
    kind: "failed";
    title: string;
    message: string;
}
/** Stopped before anything was written. */
 | {
    kind: "cancelled";
    title: string;
};
export interface RegistrySessionResult {
    /** Every item outcome in installation order. */
    outcomes: readonly RegistrySessionOutcome[];
    /** Setup stopped outside an individual item after preserving settled results. */
    cancelled?: true;
    deployed?: "production";
}
interface RegistrySession {
    add(title: string, output: readonly string[], setup?: RegistrySetupCompletion): void;
    addIncomplete(title: string, incomplete: Omit<Extract<RegistrySessionOutcome, {
        kind: "incomplete";
    }>, "kind" | "title">): void;
    addFailure(title: string, message: string): void;
    addCancellation(title: string): void;
    result(deployed?: "production"): RegistrySessionResult;
    continueAfterInstall(input: {
        appRoot: string;
        prompter: Prompter;
        signal?: AbortSignal;
    }): Promise<RegistrySessionResult>;
}
/** Owns the accumulated output and deployment decision for one `/add` session. */
export declare function createRegistrySession(deps: RegistrySessionDeps): RegistrySession;
export {};
