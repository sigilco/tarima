import { type SessionView } from "#harness/session-machine/view.js";
import type { StepResult } from "#harness/types.js";
import type { Step } from "./context.js";
/**
 * Whether the session resumes the turn on a person itself: a request it asked, or its own sign-in.
 * A child's relayed sign-in resumes the turn on its call instead, though readers see a person.
 */
export declare function resumesOnPerson(view: SessionView): boolean;
/** Whether an open request takes its answer before any message: the message waits behind it. */
export declare function holdsMessages(view: SessionView): boolean;
/** Whether the turn holds input it hasn't taken. */
export declare function hasQueuedTurnInput(view: SessionView): boolean;
/** Whether anything open stops the turn from calling the model. */
export declare function blocked(view: SessionView, state: Step["session"]["state"]): boolean;
/**
 * Nothing the step holds can run. Input the turn holds runs next step, past whatever it steers;
 * otherwise the turn stops, waiting on the person it asked or on the runtime's calls.
 */
export declare function park(step: Step): StepResult;
