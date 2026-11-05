import { type DevBootProgressReporter } from "#internal/dev-boot-progress.js";
import type { EveCliSetupStepEvent, EveCliSetupTerminalEvent } from "#cli/telemetry/index.js";
import type { DevelopmentCliOptions } from "./command-options.js";
import type { DevelopmentTuiStartup, RunDevelopmentTuiInput } from "./tui/tui.js";
import type { DevelopmentUrlTarget } from "./url-target.js";
import type { CommandLifecycle } from "../shutdown.js";
export declare function runInteractiveDevelopmentUi(input: {
    readonly applicationRoot: string;
    readonly lifecycle?: CommandLifecycle;
    readonly options: DevelopmentCliOptions;
    readonly remoteTarget?: DevelopmentUrlTarget;
    readonly report?: DevBootProgressReporter;
    readonly runDevelopmentTui?: (input: RunDevelopmentTuiInput) => Promise<void>;
    readonly onOnboardingStep?: (input: EveCliSetupStepEvent) => void;
    readonly onOnboardingTerminal?: (input: EveCliSetupTerminalEvent) => void;
    readonly server: {
        readonly appRoot?: string;
        readonly serverUrl: string;
    };
    readonly startup?: DevelopmentTuiStartup;
}): Promise<void>;
