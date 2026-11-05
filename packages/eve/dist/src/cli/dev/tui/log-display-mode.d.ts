import type { LogLevel } from "#internal/logging.js";
export declare const LOG_DISPLAY_MODES: readonly ["none", "error", "warn", "debug", "all"];
export type LogDisplayMode = (typeof LOG_DISPLAY_MODES)[number];
export declare const LOG_DISPLAY_MODE_CYCLE: readonly ["none", "error", "warn", "debug", "all"];
export declare function parseLogDisplayMode(value: string): LogDisplayMode | undefined;
export declare function nextLogDisplayMode(current: LogDisplayMode): LogDisplayMode;
export declare function isLogVisible(mode: LogDisplayMode, level?: LogLevel): boolean;
