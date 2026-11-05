import type { ModelAccessChange, ModelConnectionSelection } from "#shared/model-connection.js";
import { runModelLogin } from "#setup/flows/model-login.js";
import { runLoginFlow } from "#setup/flows/login.js";
import { runDeployFlow } from "#setup/flows/deploy.js";
import { runInstallVercelCliFlow } from "#setup/flows/install-vercel-cli.js";
import { runRegistryFlow } from "#setup/flows/registry.js";
import type { Prompter } from "#setup/prompter.js";
import type { PromptCommandOutcome } from "./runner.js";
import { type TuiPrompterRenderer } from "./tui-prompter.js";
import type { PromptCommandExtensionName } from "./prompt-commands.js";
import type { SetupFlowRenderer } from "./setup-flow.js";
import type { VercelStatusEffect } from "./vercel-status.js";
export type TuiSetupCommand = Exclude<PromptCommandExtensionName, "model">;
export type TuiSetupCommandRenderer = TuiPrompterRenderer & Pick<SetupFlowRenderer, "readProviderPicker" | "setNavigation" | "waitForInterrupt">;
export type OnboardingScreenEvent = {
    screen: "model_provider" | "model_settings" | "registry_channels" | "registry_integrations" | "registry_review" | "registry_install";
    registrySelectedCount?: number;
};
export interface TuiSetupCommandInput {
    command: TuiSetupCommand;
    /** Project root for setup that changes shared dependencies, links, or environment files. */
    appRoot: string;
    /** Selected agent root whose authored settings are changed by `/model`. */
    agentRoot?: string;
    /** The renderer surface the TUI-native prompter drives. */
    renderer: TuiSetupCommandRenderer;
    /** Initial model-flow step authorized by the runner's boot evidence. */
    initialModelStep?: "provider";
    /** Connection selected through `/login <connection>`. */
    initialLoginConnection?: ModelConnectionSelection;
    /** Registry address supplied by `/add <item>`, confirmed and installed directly. */
    initialRegistryAddress?: string;
    /** Presentation and navigation supplied by an enclosing setup journey. */
    onOnboardingScreen?: (input: OnboardingScreenEvent) => void;
    /** Live ChatGPT identity shown only inside model configuration UI. */
    chatGptAccountLabel?: string;
    /** Groups setup writes under one runtime update. */
    withExclusiveTerminal?<T>(task: () => Promise<T>): Promise<T>;
    createPrompter?: (renderer: TuiPrompterRenderer) => Prompter;
    /** Test seam; defaults to the real setup flows. */
    flows?: Partial<TuiSetupFlows>;
}
export interface TuiSetupFlows {
    runModelLogin?: typeof runModelLogin;
    runInstallVercelCliFlow: typeof runInstallVercelCliFlow;
    runRegistryFlow: typeof runRegistryFlow;
    runDeployFlow: typeof runDeployFlow;
    runLoginFlow?: typeof runLoginFlow;
}
/** Setup owns flow-close behavior; the command adapter receives only the transcript outcome. */
export interface TuiSetupCommandResult extends PromptCommandOutcome {
    message: string;
    /** The user dismissed this setup step without completing it. */
    cancelled?: true;
    /** Keep settled batch results instead of replacing them with an interrupt notice. */
    partial?: true;
    /** Replaces the echoed invocation once the command settles. */
    summary?: string;
    /** Keep warning/error lines after the bordered panel closes. */
    preserveFlowDiagnostics: boolean;
    /** Status refresh required after the command settles. */
    effect?: VercelStatusEffect | ModelAccessChange;
}
/**
 * Runs one TUI setup command (/model, /add, /deploy) over the
 * shared setup flows, asking through the TUI's own bordered panel. Never throws:
 * every outcome — done, cancelled, failed — folds into the returned command
 * result. Ctrl-C or Esc on the working indicator (no question open) aborts the
 * active flow, then keeps command ownership until its subprocesses and setup
 * stack have unwound.
 */
export declare function runTuiSetupCommand(input: TuiSetupCommandInput): Promise<TuiSetupCommandResult>;
