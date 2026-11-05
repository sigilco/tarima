import type { ActiveOperation, CaptureDecision } from "./types.js";
export declare function intersectCapture(capture: CaptureDecision, ceiling?: CaptureDecision): CaptureDecision;
export declare function activeOperation(operation: ActiveOperation, capture: CaptureDecision): ActiveOperation;
