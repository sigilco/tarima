import type { EveCliSetupStepEvent, EveCliSetupTerminalEvent } from "#cli/telemetry/index.js";
import type { DevBootProgressReporter } from "#internal/dev-boot-progress.js";
import type { CommandLifecycle } from "#cli/shutdown.js";
import { type DevDiagnostics } from "../diagnostics.js";
import { TerminalRenderer } from "./terminal-renderer.js";
import { type DevelopmentTuiTarget } from "./target.js";
import type { TuiDisplayOptions } from "./types.js";
export type { DevelopmentTuiTarget } from "./target.js";
export interface RunDevelopmentTuiInput extends TuiDisplayOptions {
    /** The local server or remote URL used by this TUI session. */
    readonly target: DevelopmentTuiTarget;
    /** Additional request headers sent by this TUI client. */
    readonly headers?: Readonly<Record<string, string>>;
    /** Text to seed the prompt input with after the UI launches. Applies to the first prompt only. */
    readonly initialInput?: string;
    /** Explicit fresh-agent onboarding handoff from `eve init`. */
    readonly onboard?: boolean;
    /** Reports timestamped steps and terminal result for fresh-agent onboarding. */
    readonly onOnboardingStep?: (input: EveCliSetupStepEvent) => void;
    readonly onOnboardingTerminal?: (input: EveCliSetupTerminalEvent) => void;
    /** Reports local CLI boot phases. Omitted for remote and programmatic TUI runs. */
    readonly onBootProgress?: DevBootProgressReporter;
    /** Gives setup subprocesses exclusive terminal and development-host ownership. */
    withExclusiveTerminal?: <T>(task: () => Promise<T>) => Promise<T>;
    readonly lifecycle?: CommandLifecycle;
    /** Prepared editing-only startup UI reused by the initialized local runner. */
    startup?: DevelopmentTuiStartup;
}
export interface DevelopmentTuiStartup {
    readonly diagnostics: DevDiagnostics | undefined;
    readonly renderer: TerminalRenderer;
    finish(): {
        draft: string;
        queuedPrompt: string | undefined;
    };
    shutdown(): Promise<void>;
}
export declare function startDevelopmentTuiStartup(input: TuiDisplayOptions & {
    readonly appRoot: string;
    readonly initialInput?: string;
    readonly onExitRequest: () => void;
}): Promise<DevelopmentTuiStartup>;
/**
 * Runs the `eve dev` terminal UI against the given server URL until the
 * user exits.
 *
 * The configured client is handed to the runner so its subagent
 * child-session streams inherit the same auth. Turn-dispatch failures —
 * including the Vercel Deployment Protection challenge — are formatted into
 * the inline error region rather than crashing the command.
 */
export declare function runDevelopmentTui(input: RunDevelopmentTuiInput): Promise<void>;
