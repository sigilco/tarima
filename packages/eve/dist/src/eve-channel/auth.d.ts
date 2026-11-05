import { type VercelOidcOptions } from "#public/channels/auth.js";
import type { EveAuthFn } from "#eve-channel/types.js";
/** Vercel OIDC verification and eve-channel permissions for matched subjects. */
export interface EveVercelOidcOptions extends Omit<VercelOidcOptions, "subjects"> {
    /**
     * Additional subjects allowed to authenticate, with whole-string `*` matching.
     * Only an explicit grant on a matching entry permits service/runtime callers to use stubs.
     * String entries and implicit current-project acceptance grant ordinary access only.
     */
    readonly subjects?: readonly (string | {
        readonly subject: string;
        readonly allowToolStubs?: boolean;
    })[];
}
/**
 * Authenticates with Vercel OIDC and grants eve-channel permissions from matched subject entries.
 * User principals never receive subject-based grants. Declares the OIDC Bearer challenge.
 */
export declare function eveVercelOidc(opts?: EveVercelOidcOptions): EveAuthFn;
