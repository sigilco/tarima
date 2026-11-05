import type { FlushableStreamState } from '../flushable-stream.js';
export declare const STEP_STREAM_DRAIN_TIMEOUT_MS = 30000;
export declare function getStepStreamDrainTimeoutMs(): number;
export declare function isClientDisconnectError(error: unknown): boolean;
export declare function settleReleasedStepStreams(states: FlushableStreamState[]): Promise<void>;
//# sourceMappingURL=step-streams.d.ts.map