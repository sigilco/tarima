import { type Command } from "#compiled/commander/index.js";
import type { CliApplicationContext } from "#cli/application-command.js";
import type { ConnectPrincipalType } from "#setup/connection-connector.js";
interface IntegrationCommandLogger {
    error(message: string): void;
    log(message: string): void;
}
export declare function parseConnectPrincipalType(value: string): ConnectPrincipalType;
/** Registers built-in integration setup commands used by trusted registry items. */
export declare function registerIntegrationCommands(input: {
    program: Command;
    logger: IntegrationCommandLogger;
    applicationContext: CliApplicationContext;
}): void;
export {};
