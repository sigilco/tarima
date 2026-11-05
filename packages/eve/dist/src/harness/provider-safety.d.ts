import type { SessionAuthContext } from "#channel/types.js";
import type { ModelProfile } from "#harness/model-profile.js";
import type { HarnessSession } from "#harness/types.js";
/**
 * Adds a provider-specific end-user safety identifier without disclosing the
 * raw eve principal. Authored provider options take precedence over the default.
 */
export declare function mergeProviderSafetyIdentifier(provider: string, providerOptions: Readonly<Record<string, unknown>> | undefined, auth: SessionAuthContext | null): Record<string, unknown> | undefined;
/** Composes the per-call defaults shared by model steps and compaction. */
export declare function resolveCallProviderOptions(input: {
    readonly auth: SessionAuthContext | null;
    readonly profile: ModelProfile;
    readonly providerOptions: Readonly<Record<string, unknown>> | undefined;
    readonly session: Pick<HarnessSession, "rootSessionId" | "sessionId">;
}): Record<string, unknown> | undefined;
