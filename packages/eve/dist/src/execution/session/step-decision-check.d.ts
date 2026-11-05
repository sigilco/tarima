import type { DurableStepResult } from "#execution/session/turn-step-types.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
/**
 * How a turn step's decision disagrees with what the tables say the turn waits on, if it does. A
 * step that pauses on calls only requested, which the next durable step dispatches or, for task
 * tool calls, answers, is the one known disagreement, `dispatch-deferred`: the tables say the
 * session has work, and it does.
 */
export declare function stepDisagreement(result: DurableStepResult, view: SessionView): string | undefined;
