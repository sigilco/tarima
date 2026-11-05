import type { EveCliSetupFailureCode } from "#cli/telemetry/index.js";
import { type PackageManagerInstallResult } from "#setup/primitives/index.js";
/** Keeps a bounded error tail, falling back to npm detail only when no other output exists. */
export declare function createInstallDiagnostics(): {
    append(text: string): void;
    result(): {
        lines: readonly string[];
        truncated: boolean;
    };
};
export declare function packageManagerInstallFailureCode(result: PackageManagerInstallResult): EveCliSetupFailureCode;
