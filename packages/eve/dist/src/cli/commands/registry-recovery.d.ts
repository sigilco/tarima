import type { RegistrySetupCompletion } from "#setup/registry-setup-protocol.js";
export interface RegistryCommandLogger {
    error(message: string): void;
    log(message: string): void;
}
export declare function reportRegistryCompletion(logger: RegistryCommandLogger, item: string, completion: RegistrySetupCompletion | false, options: {
    nonInteractive?: boolean;
}): RegistrySetupCompletion | undefined;
export declare function errorMessage(error: unknown): string;
export declare function runRegistryAction<T>(logger: RegistryCommandLogger, _appRoot: string, action: () => Promise<T>, options?: {
    rethrow?: (error: unknown) => boolean;
}): Promise<T | undefined>;
export declare function resolveRegistryItemForAdd<T>(logger: RegistryCommandLogger, loadItem: () => Promise<T>, printSuggestions: () => Promise<void>): Promise<{
    found: true;
    item: T;
} | {
    found: false;
}>;
export declare function setupResumeCommand(item: string): string;
export declare function setupReminder(item: string, outcome: "cancelled" | "skipped"): string;
