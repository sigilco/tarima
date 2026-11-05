import { type RegistryCommandLogger } from "./registry-recovery.js";
/** Adds registry namespace mappings to the project's package.json. */
export declare function runRegistryAddCommand(logger: RegistryCommandLogger, appRoot: string, mappings: readonly string[]): Promise<void>;
