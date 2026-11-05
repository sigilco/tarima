import type { RunInput, SessionAuthContext } from "#channel/types.js";
import { INVOCATION_OWNER_ATTRIBUTE, INVOCATION_TOKEN_ATTRIBUTE } from "#internal/invocation/attributes.js";
export { INVOCATION_OWNER_ATTRIBUTE, INVOCATION_TOKEN_ATTRIBUTE };
type ExternalInvocationMetadata = NonNullable<RunInput["externalInvocation"]>;
/** Fixed-width fingerprint used to bind an invocation to its initiating principal. */
export declare function invocationOwnerKey(auth: SessionAuthContext | null): string;
export declare function buildInvocationAttributes(metadata: ExternalInvocationMetadata): Readonly<Record<string, string>>;
