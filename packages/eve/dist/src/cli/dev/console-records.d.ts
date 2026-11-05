import { type LogLevel } from "#internal/logging.js";
export declare const CONSOLE_RECORD_PREFIX = "\u001Eeve-console:";
export interface ConsoleRecord {
    readonly level: LogLevel;
    readonly text: string;
}
declare let subscriber: ((record: ConsoleRecord) => void) | undefined;
export declare function setConsoleRecordSubscriber(value: typeof subscriber): void;
export declare function forwardConsoleRecord(record: ConsoleRecord): void;
export declare function createConsoleOutputForwarder(raw: (text: string) => void): {
    write(chunk: string): void;
    flush(): void;
};
export declare function parseConsoleRecord(line: string): ConsoleRecord | undefined;
/** Runs in the dev child and its worker threads before application imports. */
export declare function installConsoleRecords(): void;
export {};
