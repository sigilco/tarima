import type { Session } from "#channel/session.js";
import { type SignIn } from "#channel/sign-in.js";
/** The latest matching sign-in still open in the recent durable stream. */
export declare function findPendingAuthorization(session: Pick<Session, "stream">, matches: (signIn: SignIn) => boolean): Promise<SignIn | undefined>;
