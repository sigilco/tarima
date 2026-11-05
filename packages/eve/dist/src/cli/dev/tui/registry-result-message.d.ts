import type { RegistryCatalogItem } from "#cli/commands/registry.js";
import type { RegistrySessionResult } from "#setup/flows/registry-session.js";
/** Builds the shared transient progress update for `/add` and initial onboarding. */
export declare function registryItemProgress(renderer: {
    replaceContent?(content?: {
        headline: string;
        facts: readonly {
            label: string;
            value: string;
        }[];
    }): void;
    setNavigation?(navigation: undefined): void;
    setStatus(status: string | undefined): void;
}): (item: RegistryCatalogItem, index: number, total: number) => void;
interface RegistryCommandOutcome {
    failed: boolean;
    /** Replaces the echoed `/add` once it settles. */
    summary: string;
    /** Detail hung under the summary; empty when the summary says it all. */
    message: string;
}
/**
 * Summarizes an `/add` session in place of its echoed command. One item folds
 * into the summary itself; several items list one marked row each.
 */
export declare function registryCommandOutcome(result: RegistrySessionResult, notes?: readonly string[]): RegistryCommandOutcome;
export {};
