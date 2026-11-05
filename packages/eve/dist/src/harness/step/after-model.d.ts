import type { StepResult } from "#harness/types.js";
import type { ModelResponse } from "#harness/model-call/run.js";
import { type Step } from "#harness/step/context.js";
export declare function handleStepResult(step: Step, input: ModelResponse): Promise<StepResult>;
