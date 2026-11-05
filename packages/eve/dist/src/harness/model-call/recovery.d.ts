import type { HarnessStepResult } from "#harness/step-hooks.js";
import type { ModelCallOptions } from "./call.js";
/** Recovery changes the request, never executes it: drop unsupported tools, then nudge once. */
export declare function recoverModelCall(error: unknown, options: ModelCallOptions, diagnostics: {
    readonly sessionId: string;
    readonly turnId: string;
}): ModelCallOptions | undefined;
/**
 * Whether a step produced no assistant text or tool work. The caller decides
 * whether a successful empty `stop` is usable for the session.
 */
export declare function isEmptyModelResponse(step: HarnessStepResult): boolean;
/**
 * Rethrows the AI SDK's `NoOutputGeneratedError` as
 * {@link EmptyModelResponseError}. Since `ai@7.0.0-canary.169`
 * (vercel/ai#15938) a stream that closes after metadata without output or
 * a finish chunk rejects — the SDK enqueues the error onto `fullStream`
 * (so `emitStreamContent` throws it) and never emits `finish-step`, so
 * `onStepEnd` does not fire and the step hooks' `stepResult` promise
 * would never settle. The same condition previously completed as an empty
 * step caught by {@link isEmptyModelResponse}; normalizing here funnels
 * both shapes into the one-shot empty-response reissue.
 */
export declare function rethrowNoOutputAsEmptyResponse(error: unknown): never;
