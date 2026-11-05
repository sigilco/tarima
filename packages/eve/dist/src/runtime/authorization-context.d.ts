import type { SessionAuthContext } from "#channel/types.js";
import type { ToolAuthOptions, ToolAuthProvider } from "#tools/definition.js";
import type { TokenResult } from "#shared/connection-types.js";
import { type ScopedAuthorization } from "#runtime/connections/scoped-authorization.js";
/** Shared getToken/requireAuth capability, independent of the executing tool or workflow. */
export declare function createAuthorizationContext(input: {
    readonly scope: string;
    readonly boundResponder?: SessionAuthContext;
    readonly completeAuthorization?: (scoped: ScopedAuthorization) => Promise<boolean>;
}): {
    getToken(provider?: ToolAuthProvider, options?: ToolAuthOptions): Promise<TokenResult>;
    /**
     * The given responder's stored token, resolved through this execution's
     * providers; never starts or completes a sign-in.
     */
    getResponderToken(responder: SessionAuthContext, provider: ToolAuthProvider, options?: ToolAuthOptions): Promise<TokenResult>;
    requireAuth(provider?: ToolAuthProvider, options?: ToolAuthOptions): never;
    run: (execute: () => unknown) => Promise<unknown> | AsyncIterable<unknown>;
};
