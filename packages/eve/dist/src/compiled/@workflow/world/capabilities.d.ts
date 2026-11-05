import { z } from '#compiled/zod/index.js';
import type { WorldCapabilities } from './interfaces.js';
/**
 * Parses a {@link WorldCapabilities} object received from another process,
 * such as a target deployment's health-check response.
 *
 * Tolerant by design, because the peer may run a newer or older SDK:
 *
 * - unknown keys are dropped, so a newer peer advertising a capability this
 *   build does not know about still parses;
 * - a malformed field reads as absent (unsupported), without affecting the
 *   others;
 * - a value that is not an object at all reads as no capabilities.
 *
 * Every capability fails closed when absent, so tolerance can only ever turn
 * a feature off. The documentation for each field lives on
 * {@link WorldCapabilities}.
 */
export declare const WorldCapabilitiesSchema: z.ZodCatch<z.ZodOptional<z.ZodObject<{
    invoke: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
    hookRetention: z.ZodCatch<z.ZodOptional<z.ZodObject<{
        active: z.ZodBoolean;
    }, z.core.$strip>>>;
    atomicStartHook: z.ZodCatch<z.ZodOptional<z.ZodObject<{
        active: z.ZodBoolean;
    }, z.core.$strip>>>;
    maxConcurrency: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
    inBandFence: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
    hookResumeDedup: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
    resolvedHookResume: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
    hookForceClaim: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
    deploymentAffinity: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
    dynamicWorkflowCode: z.ZodCatch<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>>>;
/** Parses a peer's capabilities; see {@link WorldCapabilitiesSchema}. */
export declare function parseWorldCapabilities(value: unknown): WorldCapabilities | undefined;
//# sourceMappingURL=capabilities.d.ts.map