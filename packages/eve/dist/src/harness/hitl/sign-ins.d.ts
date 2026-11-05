import type { AuthorizationChallenge } from "#harness/authorization.js";
import type { SignInChallenge } from "#protocol/session-events/families/interaction.js";
import { type SessionProjection } from "#protocol/session-projection.js";
import type { InteractionRow } from "#protocol/session-projection/tables.js";
/** What makes two sign-in attempts the same one. */
interface SignInIdentity extends Pick<AuthorizationChallenge, "candidateId" | "grant" | "name"> {
    readonly principal?: SignInChallenge["principal"];
}
/** The pending sign-ins once `challenges` are asked for: each replaces the attempt it supersedes. */
export declare function withSignIns(previous: readonly AuthorizationChallenge[], challenges: readonly AuthorizationChallenge[]): readonly AuthorizationChallenge[];
/** Keeps the last challenge for each sign-in and principal. */
export declare function resolveActiveAuthorizationChallenges(challenges: readonly AuthorizationChallenge[]): readonly AuthorizationChallenge[];
/** The attempts in `previous` that `replacements` replace: the same sign-in and principal. */
export declare function supersededChallenges(previous: readonly AuthorizationChallenge[], replacements: readonly AuthorizationChallenge[]): readonly AuthorizationChallenge[];
/**
 * The sign-in this turn already tried and failed terminally (`retryable: false`) for the same
 * grant and principal as `challenge`: asking again would send the person through the same
 * failure. Calls before the turn's first sign-in failure have nothing to find.
 */
export declare function terminalSignInFailure(projection: SessionProjection, challenge: SignInIdentity): InteractionRow | undefined;
/** The key a sign-in callback names its attempt by. */
export declare function signInAttemptKey(challenge: AuthorizationChallenge): string;
export {};
