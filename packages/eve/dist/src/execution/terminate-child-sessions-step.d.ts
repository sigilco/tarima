import { type DurableSessionState } from "#execution/durable-session-store.js";
/**
 * Session end ends every run the session started, including cancelled runs that haven't
 * confirmed yet. Each run ends the agent sessions it opened.
 */
export declare function terminateChildSessionsStep(input: {
    readonly sessionState: DurableSessionState;
}): Promise<void>;
export declare function reportChildSessionTeardownFailureStep(input: {
    readonly error: unknown;
    readonly parentSessionId: string;
}): Promise<void>;
