import type { Usage } from "#protocol/session-events/envelope.js";
import type { Publish } from "#harness/session-machine/commit.js";
/**
 * Runs `fn` with usage it records published as the step's. Usage a hook recorded without waiting
 * is written before the step returns, so its usage report counts it.
 */
export declare function withUsageSink<T>(publish: Publish, fn: () => Promise<T>): Promise<T>;
/** Runs a tool's `fn` with usage it records owned by its call. */
export declare function withUsageCall<T>(callId: string, fn: () => T): T;
/**
 * Runs a reaction's `fn`, where usage it records is published without waiting on reactions. A
 * reaction can start inside a tool's call, from its progress, but what it spends isn't the call's.
 */
export declare function withUsageInEffect<T>(fn: () => T): T;
/**
 * Records what a model call made outside eve's own model steps spent, so the session's usage and
 * its limits count it: inside a tool, against its call. Outside a session step it does nothing.
 */
export declare function recordUsage(usage: Partial<Usage>, options?: {
    readonly kind?: "auxiliary" | "decision";
}): Promise<void>;
