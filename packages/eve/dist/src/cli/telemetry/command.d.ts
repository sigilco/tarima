import type { Command } from "#compiled/commander/index.js";
type TelemetryLogger = {
    log(message: string): void;
};
export declare function registerEveTelemetryCommands(program: Command, logger: TelemetryLogger): void;
export declare function showEveTelemetryStatus(logger: TelemetryLogger): Promise<void>;
export declare function enableEveTelemetry(logger: TelemetryLogger): Promise<void>;
export declare function disableEveTelemetry(logger: TelemetryLogger): Promise<void>;
export {};
