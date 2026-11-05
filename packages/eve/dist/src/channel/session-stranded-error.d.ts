/** The owner of a stranded session, as far as it recorded itself. */
interface StrandedSessionOwner {
    /** eve version that built the owner, when it recorded one. */
    readonly eveVersion?: string;
}
/**
 * Thrown when sending, responding, clearing, or following the live stream of
 * a session whose owner another eve version built, on a World that only runs
 * this build, so the owner can never execute again. Nothing is delivered and
 * nothing is mutated. Historical reads with `follow: false` still succeed.
 * Call `end()` to retire the session, then start a new one. Narrow with
 * {@link SessionStrandedError.is}.
 */
export declare class SessionStrandedError extends Error {
    readonly owner: StrandedSessionOwner;
    constructor(owner: StrandedSessionOwner, message?: string);
    /** Narrows stranded-session errors across bundle boundaries, where `instanceof` can miss. */
    static is(error: unknown): error is SessionStrandedError;
}
/**
 * One actionable sentence pair that names the cause, the version, and the
 * next step. `nextStep` replaces the default recovery instruction.
 */
export declare function describeStrandedSession(owner: StrandedSessionOwner, nextStep?: string): string;
export {};
