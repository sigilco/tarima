import { type MessageHandler, type RetryHandler } from "#compiled/@vercel/queue/index.js";
import type { NitroArtifactsConfig } from "#internal/nitro/routes/runtime-artifacts.js";
/** Receives verified Vercel Schedules occurrences and dispatches at-least-once callbacks. */
export declare function handleScheduleCollectionConsumer(config: NitroArtifactsConfig, request: Request): Promise<Response>;
/** Shares occurrence verification and dispatch between hosted callbacks and local queue polling. */
export declare function createScheduleCollectionConsumer(config: NitroArtifactsConfig): {
    readonly handler: MessageHandler<unknown>;
    readonly retry: RetryHandler;
};
