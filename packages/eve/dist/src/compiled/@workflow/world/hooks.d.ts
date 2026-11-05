import { z } from '#compiled/zod/index.js';
import type { SerializedData } from './serialization.js';
import type { PaginationOptions, ResolveData } from './shared.js';
/**
 * Minimal, immutable slice of a hook's owning run needed to resume it:
 * enough for encryption-key resolution, serialization/compression capability
 * selection, queue routing, and trace linking, without fetching the full run.
 *
 * Persisted on new hook records (workflow-server) and also returned inline by
 * `getByToken`, so a resume can skip the separate `runs.get`. Deliberately
 * excludes the run's mutable state (e.g. status), inputs/outputs, attributes,
 * and any secret: only fields that are fixed at hook-creation time.
 */
export declare const HookResumeContextSchema: z.ZodObject<{
    deploymentId: z.ZodString;
    workflowName: z.ZodString;
    runSpecVersion: z.ZodOptional<z.ZodNumber>;
    workflowCoreVersion: z.ZodOptional<z.ZodString>;
    nodeVersion: z.ZodOptional<z.ZodString>;
    traceCarrier: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    encryptionPublicKey: z.ZodOptional<z.ZodString>;
    hookResumeInputVersion: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type HookResumeContext = z.infer<typeof HookResumeContextSchema>;
/**
 * Current version of the lazy-hook-resume consumer protocol. A run's creating
 * deployment stamps this into its execution context (and the server mirrors it
 * onto `HookResumeContext.hookResumeInputVersion`) to attest that its
 * `@workflow/core` re-ensures the `hook_received` event from a queue message's
 * `hookInput`. Current producers write the event durably BEFORE publishing the
 * wake and do not read this marker; it exists for older producers whose lazy
 * path requires the target run's marker to be at least this value. Bump only
 * on a breaking change to the `hookInput` re-ensure contract.
 */
export declare const HOOK_RESUME_INPUT_VERSION = 1;
/**
 * Current version of the backend lazy-hook-resume dedup contract: the live
 * backend enforces a `(runId, resumeId)` constraint so repeated deliveries of
 * one resume's queue message converge on exactly one `hook_received`.
 * `resumeHook()`'s lazy path requires the backend to attest at least this
 * version. Bump only on a breaking change to the constraint semantics.
 */
export declare const HOOK_RESUME_DEDUP_VERSION = 1;
/**
 * Backend-attested capabilities for lazy hook resume, computed FRESH on every
 * by-token hook lookup and returned inline on {@link HookSchema.resumeCapabilities}.
 *
 * Response-only and transient: NEVER persisted on the hook entity and NEVER
 * part of {@link HookResumeContextSchema}. Recomputing it per response is what
 * makes a server rollback or kill switch take effect immediately: a rolled-back
 * or kill-switched server stops emitting it, dropping new resumes to the
 * sequential path with no stranded hooks. (Contrast with the per-run, persisted
 * `hookResumeInputVersion`, which attests the *consumer* and is fixed at run
 * creation.)
 */
export declare const HookResumeCapabilitiesSchema: z.ZodObject<{
    hookResumeDedupVersion: z.ZodNumber;
}, z.core.$strip>;
export type HookResumeCapabilities = z.infer<typeof HookResumeCapabilitiesSchema>;
/**
 * Schema for workflow hooks.
 *
 * Note: metadata uses SerializedDataSchema to support both:
 * - specVersion >= 2: Uint8Array (binary devalue format)
 * - specVersion 1: any (legacy JSON format)
 */
/**
 * Who a force-claimed hook took its token from. Written by the World in the
 * same transaction that re-points the token, and returned on the
 * `hook_created` response and on every later read of the hook.
 *
 * `workflowName`, `deploymentId` and `runSpecVersion` are the VICTIM run's:
 * the claimer's runtime publishes the victim's wake from them (the victim's
 * replay has to read the `hook_disposed{forceClaimedBy}` row the takeover
 * left in its log). They are optional only because a World may not have them
 * for a legacy victim; when absent the runtime skips the wake and the victim
 * reads the row on its next invocation.
 */
export declare const HookClaimedFromSchema: z.ZodObject<{
    runId: z.ZodString;
    hookId: z.ZodString;
    workflowName: z.ZodOptional<z.ZodString>;
    deploymentId: z.ZodOptional<z.ZodString>;
    runSpecVersion: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type HookClaimedFrom = z.infer<typeof HookClaimedFromSchema>;
export declare const HookSchema: z.ZodObject<{
    runId: z.ZodString;
    hookId: z.ZodString;
    token: z.ZodString;
    ownerId: z.ZodString;
    projectId: z.ZodString;
    environment: z.ZodString;
    metadata: z.ZodOptional<z.ZodUnion<readonly [z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>]>>;
    createdAt: z.ZodCoercedDate<unknown>;
    specVersion: z.ZodOptional<z.ZodNumber>;
    isWebhook: z.ZodOptional<z.ZodBoolean>;
    isSystem: z.ZodOptional<z.ZodBoolean>;
    tokenRetentionUntil: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    resumeContext: z.ZodOptional<z.ZodObject<{
        deploymentId: z.ZodString;
        workflowName: z.ZodString;
        runSpecVersion: z.ZodOptional<z.ZodNumber>;
        workflowCoreVersion: z.ZodOptional<z.ZodString>;
        nodeVersion: z.ZodOptional<z.ZodString>;
        traceCarrier: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        encryptionPublicKey: z.ZodOptional<z.ZodString>;
        hookResumeInputVersion: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    resumeCapabilities: z.ZodOptional<z.ZodObject<{
        hookResumeDedupVersion: z.ZodNumber;
    }, z.core.$strip>>;
    claimedFrom: z.ZodOptional<z.ZodObject<{
        runId: z.ZodString;
        hookId: z.ZodString;
        workflowName: z.ZodOptional<z.ZodString>;
        deploymentId: z.ZodOptional<z.ZodString>;
        runSpecVersion: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
/**
 * Represents a Hook. Hooks kept by minimum retention remain readable after
 * their workflow runs end, but cannot be resumed.
 *
 * Note: metadata type is SerializedData to support both:
 * - specVersion >= 2: Uint8Array (binary devalue format)
 * - specVersion 1: unknown (legacy JSON format)
 */
export type Hook = z.infer<typeof HookSchema>;
export interface CreateHookRequest {
    hookId: string;
    token: string;
    metadata?: SerializedData;
    isWebhook?: boolean;
}
export interface GetHookByTokenParams {
    token: string;
}
export interface ListHooksParams {
    runId?: string;
    pagination?: PaginationOptions;
    resolveData?: ResolveData;
}
export interface GetHookParams {
    resolveData?: ResolveData;
}
//# sourceMappingURL=hooks.d.ts.map