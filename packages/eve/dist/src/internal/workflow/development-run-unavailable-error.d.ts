/**
 * Raised by the `eve dev` World when a caller looks up a hook whose run
 * belongs to a generation this dev server will not execute. It crosses the
 * parent/worker boundary as a plain error, so identity is its name and its
 * enumerable fields rather than the class.
 */
export declare class DevelopmentRunUnavailableError extends Error {
    readonly availability: "dormant" | "ineligible";
    readonly runId: string;
    constructor(input: {
        readonly availability: "dormant" | "ineligible";
        readonly runId: string;
    });
    static is(value: unknown): value is DevelopmentRunUnavailableError;
}
