import type { CaptureDecision } from "./core/types.js";
export declare function currentCapture(): CaptureDecision | undefined;
export declare function withCapture<T extends {
    setValue(key: symbol, value: unknown): T;
}>(host: T, capture: CaptureDecision): T;
