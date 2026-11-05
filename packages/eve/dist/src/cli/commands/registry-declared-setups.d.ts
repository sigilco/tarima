import { type Prompter } from "#setup/prompter.js";
import type { RegistrySetupCompletion } from "#setup/registry-setup-protocol.js";
import { type SetupPrerequisite } from "#setup/integrations/shared/prerequisite.js";
import type { RegistryCommandLogger, RegistrySetupDependencies } from "./registry.js";
import type { RegistrySetupCommand } from "./registry-setup-command.js";
/**
 * A declared setup that failed after the item's source was installed. Keeps
 * the original error as `cause` so interactive callers can report the item as
 * installed-but-not-set-up and recover from a structured prerequisite (for
 * example `vercel login`) instead of parsing the message.
 */
export declare class RegistrySetupFailedError extends Error {
    readonly item: string;
    readonly resumeCommand: string;
    /** The failure without the resume hint, for callers that render it separately. */
    readonly reason: string;
    constructor(input: {
        item: string;
        resumeCommand: string;
        cause: unknown;
    });
    get prerequisite(): SetupPrerequisite | undefined;
}
interface DeclaredSetupOptions {
    yes?: boolean;
    force?: boolean;
    nonInteractive?: boolean;
    answers?: Record<string, unknown>;
    silent?: boolean;
    prompter?: Prompter;
    signal?: AbortSignal;
}
/** Runs and combines the setup commands declared by one registry item. */
export declare function runDeclaredSetups(input: {
    logger: RegistryCommandLogger;
    appRoot: string;
    item: string;
    setups: readonly RegistrySetupCommand[] | undefined;
    options: DeclaredSetupOptions;
    dependencies: RegistrySetupDependencies;
    resumeCommand: string;
}): Promise<RegistrySetupCompletion | false>;
export {};
