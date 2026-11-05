import type { SetupPrerequisite } from "#setup/integrations/shared/prerequisite.js";
import { type Prompter } from "#setup/prompter.js";
import type { RegistrySetupCompletion } from "#setup/registry-setup-protocol.js";
import { type RegistryCommandLogger } from "./registry-recovery.js";
import type { runRegistrySetupCommand } from "./registry-setup-command.js";
import { prepareWebRegistryProject } from "./registry-project.js";
export { runRegistryAddCommand } from "./registry-add-command.js";
export type { RegistryCommandLogger } from "./registry-recovery.js";
/** Source was installed, but the item's setup was cancelled, skipped, or failed. */
export interface RegistrySetupIncomplete {
    resumeCommand: string;
    /** Why setup failed; absent when it was cancelled or skipped. */
    reason?: string;
    /** A structured action that unblocks setup, such as `vercel login`. */
    prerequisite?: SetupPrerequisite;
}
export interface AddCommandOptions {
    skipInstall?: boolean;
    overwrite?: boolean;
    skipSetup?: boolean;
    yes?: boolean;
    nonInteractive?: boolean;
    answers?: Record<string, unknown>;
    /** Suppresses the registry SDK's terminal-native progress output. */
    silent?: boolean;
}
/** Options shared by registry catalog commands. */
export interface RegistryCommandOptions {
    /** Emit the underlying registry result as JSON. */
    json?: boolean;
}
/** Options for searching registry catalogs. */
export interface RegistrySearchCommandOptions extends RegistryCommandOptions {
    /** Maximum number of matching items to return. */
    limit?: number;
}
export interface RegistrySetupDependencies {
    loadSetupCommandRunner(): Promise<typeof runRegistrySetupCommand>;
}
export interface AddCommandDependencies extends RegistrySetupDependencies {
    createPrompter?: () => Prompter;
    hasInteractiveTerminal?: () => boolean;
    prepareWebRegistryProject?: typeof prepareWebRegistryProject;
}
type RunAddCommandOptions = AddCommandOptions & {
    prompter?: Prompter;
    signal?: AbortSignal;
    setupAuthorized?: boolean;
    /** Throw {@link RegistrySetupFailedError} to the caller instead of logging it. */
    throwSetupFailures?: boolean;
};
/** One discoverable item from an eve-compatible registry catalog. */
export interface RegistryCatalogItem {
    address: string;
    name: string;
    title?: string;
    type?: string;
    description?: string;
    source: string;
}
/** Catalog items plus non-fatal failures from the registry sources queried. */
export interface RegistryCatalogResult {
    items: RegistryCatalogItem[];
    total: number;
    errors: Array<{
        message: string;
        registry: string;
    }>;
}
/**
 * Resolves the official registry URL, honoring the explicit development trust override.
 *
 * The override makes its registry eligible to supply setup commands, so it must be
 * configured in the process environment rather than project configuration.
 */
export declare function resolveOfficialRegistryUrl(configured?: string | undefined): string;
/** Browses all configured catalogs, or one namespace or URL source. */
export declare function browseRegistryCatalog(appRoot: string, options?: {
    query?: string;
    source?: string;
}): Promise<RegistryCatalogResult>;
/** Installs an official, configured, or URL-addressed registry item. */
export declare function installRegistryItem(appRoot: string, item: string, options?: AddCommandOptions & {
    prompter?: Prompter;
    signal?: AbortSignal;
}, dependencies?: AddCommandDependencies): Promise<{
    output: readonly string[];
    setup?: RegistrySetupCompletion;
    setupIncomplete?: RegistrySetupIncomplete;
}>;
/** Installs an official, configured, or URL-addressed registry item. */
export declare function runAddCommand(logger: RegistryCommandLogger, appRoot: string, item: string, options: RunAddCommandOptions, dependencies?: AddCommandDependencies): Promise<RegistrySetupCompletion | false | "setup-incomplete" | undefined>;
/** Lists registry items from every configured source or one selected source. */
export declare function runRegistryListCommand(logger: RegistryCommandLogger, appRoot: string, source?: string, options?: RegistryCommandOptions): Promise<void>;
/** Searches registry items across every configured source or one selected source. */
export declare function runRegistrySearchCommand(logger: RegistryCommandLogger, appRoot: string, query: string, source?: string, options?: RegistrySearchCommandOptions): Promise<void>;
/** Inspects one official, configured, or URL-addressed registry item. */
export declare function runRegistryViewCommand(logger: RegistryCommandLogger, appRoot: string, item: string, options?: RegistryCommandOptions): Promise<void>;
