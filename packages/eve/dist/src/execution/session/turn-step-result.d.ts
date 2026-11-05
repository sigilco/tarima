import type { DurableStepResult, DurableStepResultFields } from "#execution/session/turn-step-types.js";
import type { HarnessSession, SettledTurn, StepResult } from "#harness/types.js";
export declare function resolveSessionStepResult(stepResult: StepResult, nextSerializedContext: Record<string, unknown>): DurableStepResult;
/**
 * The turn pauses on the calls the runtime runs for it, or, with none, parks the session.
 * `settled` is a settled turn's answer to its delegated caller.
 */
export declare function pausedOrParked(session: HarnessSession, fields: DurableStepResultFields, settled?: SettledTurn): DurableStepResult;
