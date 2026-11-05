import { type Command } from "#compiled/commander/index.js";
import type { CliApplicationContext } from "#cli/application-command.js";
import type { EveCliTelemetry } from "#cli/telemetry/index.js";
import type { DevelopmentServer, DevelopmentServerOptions } from "#internal/nitro/host/types.js";
import type { RunDevelopmentTuiInput } from "./tui/tui.js";
interface DevelopmentCommandLogger {
    log(message: string): void;
}
interface DevelopmentCommandRuntime {
    runDevelopmentTui?: (input: RunDevelopmentTuiInput) => Promise<void>;
    startHost?: (appRoot: string, options?: DevelopmentServerOptions) => DevelopmentServer;
}
interface DevelopmentCommandTelemetry {
    trackDevContext: EveCliTelemetry["trackDevContext"];
    trackSetupStep: EveCliTelemetry["trackSetupStep"];
    trackSetupTerminal: EveCliTelemetry["trackSetupTerminal"];
}
/** Registers an interactive client for existing eve agents. */
export declare function registerRemoteCommands(input: {
    applicationContext: CliApplicationContext;
    logger: DevelopmentCommandLogger;
    program: Command;
    runtime: DevelopmentCommandRuntime;
    telemetry: DevelopmentCommandTelemetry;
}): void;
/** Registers the local development server command. */
export declare function registerDevelopmentCommand(input: {
    applicationContext: CliApplicationContext;
    logger: DevelopmentCommandLogger;
    program: Command;
    runtime: DevelopmentCommandRuntime;
    telemetry: DevelopmentCommandTelemetry;
}): void;
export {};
