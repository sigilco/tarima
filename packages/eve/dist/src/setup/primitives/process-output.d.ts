/** The output stream that emitted one subprocess line. */
export type ProcessOutputStream = "stdout" | "stderr";
/** A complete line emitted by a child process for parent-owned rendering. */
export interface ProcessOutputLine {
    stream: ProcessOutputStream;
    text: string;
}
/** Receives complete output lines while a parent-owned CLI flow is running a child process. */
export type ProcessOutputHandler = (line: ProcessOutputLine) => void;
/** Accumulates partial chunks until they can be emitted as prompt-safe lines. */
interface ProcessOutputBuffer {
    write(stream: ProcessOutputStream, chunk: Buffer): void;
    flush(): void;
}
/**
 * Converts raw stdout and stderr chunks into complete lines while preserving blank lines.
 * Carriage returns emitted by progress renderers become new parent-rendered lines.
 */
export declare function createProcessOutputBuffer(onOutput: ProcessOutputHandler): ProcessOutputBuffer;
/**
 * The last meaningful stderr line of a failed Vercel CLI run, which is where
 * the CLI prints its `Error: …` message after any progress output.
 */
export declare function vercelErrorDetail(stderr: string | undefined): string | undefined;
export {};
