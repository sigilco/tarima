import type { SetupIntegration } from "./types.js";
/** Resolves one built-in setup integration by its registry setup name. */
export declare function setupIntegration(kind: string): SetupIntegration;
export { createSetupContexts, createSetupPresenter } from "./shared/ui.js";
